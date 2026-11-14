begin;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to authenticated;

create type public.member_role as enum ('owner', 'admin', 'manager', 'barber', 'receptionist');

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 120),
  slug text not null unique check (char_length(slug) between 3 and 63 and slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  logo_url text,
  email text check (char_length(email) <= 254),
  phone text check (char_length(phone) <= 32 and phone ~ '^[0-9+(). -]*$'),
  address text check (char_length(address) <= 250),
  timezone text not null default 'Europe/Lisbon',
  currency text not null default 'EUR' check (currency ~ '^[A-Z]{3}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null check (char_length(full_name) <= 120),
  email text not null check (char_length(email) <= 254),
  avatar_url text,
  created_at timestamptz not null default now()
);

create table public.memberships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete restrict,
  role public.member_role not null,
  created_at timestamptz not null default now(),
  unique (organization_id, user_id)
);
create index memberships_by_user on public.memberships(user_id, created_at);
create unique index memberships_one_owner on public.memberships(organization_id) where role = 'owner';

create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  email text not null check (char_length(email) between 3 and 254 and email = lower(btrim(email))),
  role public.member_role not null check (role <> 'owner'),
  token_hash bytea not null unique,
  created_by uuid not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '7 days'),
  accepted_at timestamptz,
  revoked_at timestamptz,
  check (accepted_at is null or revoked_at is null)
);
create unique index invitations_one_open on public.invitations(organization_id, email)
  where accepted_at is null and revoked_at is null;
create index invitations_org on public.invitations(organization_id, created_at desc);

create table private.audit_events (
  id bigint generated always as identity primary key,
  organization_id uuid not null,
  actor_id uuid not null,
  action text not null,
  target_id uuid not null,
  created_at timestamptz not null default now()
);
create index audit_events_by_org on private.audit_events(organization_id, created_at desc);

alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.memberships enable row level security;
alter table public.invitations enable row level security;
alter table private.audit_events enable row level security;

revoke all on public.organizations, public.profiles, public.memberships, public.invitations from public, anon, authenticated, service_role;
grant select on public.organizations, public.profiles, public.memberships to authenticated;
grant select (id, organization_id, email, role, created_by, created_at, expires_at, accepted_at, revoked_at)
  on public.invitations to authenticated;

create function private.actor_role(p_org uuid)
returns public.member_role language sql stable security definer set search_path = ''
as $$
  select m.role from public.memberships m
    where m.organization_id = p_org and m.user_id = (select auth.uid());
$$;

create function private.shares_managed_organization(p_user uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.memberships mine
    join public.memberships teammate using (organization_id)
    where mine.user_id = (select auth.uid()) and mine.role in ('owner', 'admin')
      and teammate.user_id = p_user
  );
$$;

create policy organizations_read on public.organizations for select to authenticated
  using (private.actor_role(id) is not null);
create policy profiles_read on public.profiles for select to authenticated
  using (id = (select auth.uid()) or private.shares_managed_organization(id));
create policy memberships_read on public.memberships for select to authenticated
  using (user_id = (select auth.uid()) or private.actor_role(organization_id) in ('owner', 'admin'));
create policy invitations_read on public.invitations for select to authenticated
  using (private.actor_role(organization_id) in ('owner', 'admin'));

create function private.ensure_profile()
returns uuid language plpgsql security invoker set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
begin
  insert into public.profiles (id, full_name, email)
  select id, left(coalesce(nullif(btrim(raw_user_meta_data->>'full_name'), ''), split_part(email, '@', 1)), 120), lower(email)
    from auth.users where id = v_user and email_confirmed_at is not null and email is not null
  on conflict (id) do update set email = excluded.email;
  if not found then
    raise exception 'Verified account required' using errcode = '42501';
  end if;
  return v_user;
end;
$$;

create function private.can_manage(p_actor public.member_role, p_target public.member_role)
returns boolean language sql immutable security invoker set search_path = ''
as $$
  select coalesce(p_target <> 'owner' and
    (p_actor = 'owner' or (p_actor = 'admin' and p_target <> 'admin')), false);
$$;

create function private.create_organization(p_name text, p_slug text, p_email text, p_phone text, p_address text)
returns uuid language plpgsql security definer set search_path = ''
as $$
declare
  v_user uuid := private.ensure_profile();
  v_org uuid;
begin
  insert into public.organizations(name, slug, email, phone, address)
  values (btrim(p_name), lower(btrim(p_slug)), nullif(lower(btrim(p_email)), ''),
    nullif(btrim(p_phone), ''), nullif(btrim(p_address), ''))
  returning id into v_org;
  insert into public.memberships(organization_id, user_id, role) values (v_org, v_user, 'owner');
  insert into private.audit_events(organization_id, actor_id, action, target_id)
    values (v_org, v_user, 'organization.created', v_org);
  return v_org;
end;
$$;

create function private.create_invitation(p_org uuid, p_email text, p_role public.member_role)
returns text language plpgsql security definer set search_path = ''
as $$
declare
  v_email text := lower(btrim(p_email));
  v_token text := replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '');
  v_invite uuid;
begin
  if not private.can_manage(private.actor_role(p_org), p_role) then
    raise exception 'Invitation forbidden' using errcode = '42501';
  end if;
  perform 1 from public.organizations where id = p_org for update;
  if not private.can_manage(private.actor_role(p_org), p_role) then
    raise exception 'Invitation forbidden' using errcode = '42501';
  end if;
  if v_email is null or char_length(v_email) > 254 or v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    raise exception 'Invalid email' using errcode = '22023';
  end if;
  if exists (
    select 1 from public.memberships m join auth.users u on u.id = m.user_id
    where m.organization_id = p_org and lower(u.email) = v_email
  ) then
    raise exception 'Already a member' using errcode = '23505';
  end if;
  if exists (
    select 1 from public.invitations i where i.organization_id = p_org and i.email = v_email
    and i.accepted_at is null and i.revoked_at is null
    and not private.can_manage(private.actor_role(p_org), i.role)
  ) then
    raise exception 'Existing invitation forbidden' using errcode = '42501';
  end if;
  update public.invitations set revoked_at = now()
    where organization_id = p_org and email = v_email and accepted_at is null and revoked_at is null;
  insert into public.invitations(organization_id, email, role, token_hash, created_by)
    values (p_org, v_email, p_role, sha256(convert_to(v_token, 'UTF8')), auth.uid()) returning id into v_invite;
  insert into private.audit_events(organization_id, actor_id, action, target_id)
    values (p_org, auth.uid(), 'invitation.created', v_invite);
  return v_token;
end;
$$;

create function private.accept_invitation(p_token text)
returns uuid language plpgsql security definer set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_email text;
  v_invite public.invitations;
begin
  select lower(email) into v_email from auth.users where id = v_user and email_confirmed_at is not null;
  if v_email is null or p_token is null or p_token !~ '^[0-9a-f]{64}$' then
    raise exception 'Invalid invitation' using errcode = '42501';
  end if;
  select * into v_invite from public.invitations
    where token_hash = sha256(convert_to(p_token, 'UTF8')) for update;
  if not found or v_invite.email <> v_email or v_invite.expires_at <= now()
    or v_invite.revoked_at is not null or v_invite.accepted_at is not null then
    raise exception 'Invalid invitation' using errcode = '42501';
  end if;
  perform private.ensure_profile();
  insert into public.memberships(organization_id, user_id, role)
    values (v_invite.organization_id, v_user, v_invite.role)
    on conflict (organization_id, user_id) do nothing;
  update public.invitations set accepted_at = now() where id = v_invite.id;
  insert into private.audit_events(organization_id, actor_id, action, target_id)
    values (v_invite.organization_id, v_user, 'invitation.accepted', v_invite.id);
  return v_invite.organization_id;
end;
$$;

create function private.revoke_invitation(p_org uuid, p_invitation uuid)
returns void language plpgsql security definer set search_path = ''
as $$
declare
  v_actor public.member_role := private.actor_role(p_org);
begin
  if v_actor is null or v_actor not in ('owner', 'admin') then
    raise exception 'Revocation forbidden' using errcode = '42501';
  end if;
  perform 1 from public.organizations where id = p_org for update;
  update public.invitations set revoked_at = now()
    where id = p_invitation and organization_id = p_org and accepted_at is null and revoked_at is null
      and private.can_manage(private.actor_role(p_org), role);
  if not found then
    raise exception 'Revocation forbidden' using errcode = '42501';
  end if;
  insert into private.audit_events(organization_id, actor_id, action, target_id)
    values (p_org, auth.uid(), 'invitation.revoked', p_invitation);
end;
$$;

create function private.set_member_role(p_org uuid, p_member uuid, p_role public.member_role)
returns void language plpgsql security definer set search_path = ''
as $$
declare
  v_actor public.member_role := private.actor_role(p_org);
begin
  if not private.can_manage(v_actor, p_role) then
    raise exception 'Role change forbidden' using errcode = '42501';
  end if;
  perform 1 from public.organizations where id = p_org for update;
  v_actor := private.actor_role(p_org);
  update public.memberships set role = p_role
    where id = p_member and organization_id = p_org and user_id <> auth.uid()
      and private.can_manage(v_actor, role) and private.can_manage(v_actor, p_role);
  if not found then
    raise exception 'Role change forbidden' using errcode = '42501';
  end if;
  insert into private.audit_events(organization_id, actor_id, action, target_id)
    values (p_org, auth.uid(), 'membership.role_changed', p_member);
end;
$$;

create function public.create_organization(p_name text, p_slug text, p_email text, p_phone text, p_address text)
returns uuid language sql security invoker set search_path = ''
as $$ select private.create_organization(p_name, p_slug, p_email, p_phone, p_address); $$;
create function public.create_invitation(p_org uuid, p_email text, p_role public.member_role)
returns text language sql security invoker set search_path = ''
as $$ select private.create_invitation(p_org, p_email, p_role); $$;
create function public.accept_invitation(p_token text)
returns uuid language sql security invoker set search_path = ''
as $$ select private.accept_invitation(p_token); $$;
create function public.revoke_invitation(p_org uuid, p_invitation uuid)
returns void language sql security invoker set search_path = ''
as $$ select private.revoke_invitation(p_org, p_invitation); $$;
create function public.set_member_role(p_org uuid, p_member uuid, p_role public.member_role)
returns void language sql security invoker set search_path = ''
as $$ select private.set_member_role(p_org, p_member, p_role); $$;

revoke execute on all functions in schema private from public, anon, authenticated, service_role;
grant execute on function private.actor_role(uuid), private.shares_managed_organization(uuid),
  private.create_organization(text, text, text, text, text), private.create_invitation(uuid, text, public.member_role),
  private.accept_invitation(text), private.revoke_invitation(uuid, uuid),
  private.set_member_role(uuid, uuid, public.member_role) to authenticated;

revoke execute on function public.create_organization(text, text, text, text, text),
  public.create_invitation(uuid, text, public.member_role), public.accept_invitation(text),
  public.revoke_invitation(uuid, uuid), public.set_member_role(uuid, uuid, public.member_role)
  from public, anon, authenticated, service_role;
grant execute on function public.create_organization(text, text, text, text, text),
  public.create_invitation(uuid, text, public.member_role), public.accept_invitation(text),
  public.revoke_invitation(uuid, uuid), public.set_member_role(uuid, uuid, public.member_role) to authenticated;

commit;
