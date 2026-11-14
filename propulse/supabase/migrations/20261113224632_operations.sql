begin;
create schema if not exists extensions;
create extension if not exists btree_gist with schema extensions;
set local search_path = public, extensions, pg_catalog;

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 120),
  email text check (char_length(email) <= 254 and email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
  phone text check (char_length(phone) <= 32 and phone ~ '^[0-9+(). -]+$'),
  notes text not null default '' check (char_length(notes) <= 2000),
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  unique (organization_id, id)
);
create index customers_directory on public.customers(organization_id, archived, name, id);

create table public.services (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 120),
  duration_minutes integer not null check (duration_minutes between 5 and 480),
  price_cents integer not null check (price_cents between 0 and 10000000),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (organization_id, id)
);
create index services_directory on public.services(organization_id, name, id);

create table public.barbers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 120),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (organization_id, id)
);
create index barbers_directory on public.barbers(organization_id, name, id);

create table public.weekly_hours (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  barber_id uuid,
  weekday integer not null check (weekday between 1 and 7),
  opens_at time not null check (opens_at < '24:00'),
  closes_at time not null,
  check (opens_at < closes_at),
  foreign key (organization_id, barber_id) references public.barbers(organization_id, id),
  unique nulls not distinct (organization_id, barber_id, weekday, opens_at)
);

create type public.appointment_status as enum ('pending', 'confirmed', 'completed', 'cancelled', 'no_show');
create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  customer_id uuid not null,
  service_id uuid not null,
  barber_id uuid not null,
  service_name text not null,
  quoted_price_cents integer not null,
  currency text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status public.appointment_status not null default 'confirmed',
  created_at timestamptz not null default now(),
  check (starts_at < ends_at),
  foreign key (organization_id, customer_id) references public.customers(organization_id, id),
  foreign key (organization_id, service_id) references public.services(organization_id, id),
  foreign key (organization_id, barber_id) references public.barbers(organization_id, id),
  exclude using gist (organization_id with =, barber_id with =, tstzrange(starts_at, ends_at, '[)') with &&)
    where (status <> 'cancelled')
);
create index appointments_agenda on public.appointments(organization_id, starts_at, id);
create index appointments_customer on public.appointments(organization_id, customer_id, starts_at desc);
create index appointments_service on public.appointments(organization_id, service_id);
create index appointments_barber on public.appointments(organization_id, barber_id);

alter table public.customers enable row level security;
revoke all on public.customers from public, anon, authenticated, service_role;
grant select on public.customers to authenticated;
create policy customers_read on public.customers for select to authenticated
  using (private.actor_role(organization_id) in ('owner', 'admin', 'manager', 'receptionist'));

alter table public.services enable row level security;
revoke all on public.services from public, anon, authenticated, service_role;
grant select on public.services to authenticated;
create policy services_read on public.services for select to authenticated
  using (private.actor_role(organization_id) in ('owner', 'admin', 'manager', 'receptionist'));

alter table public.barbers enable row level security;
revoke all on public.barbers from public, anon, authenticated, service_role;
grant select on public.barbers to authenticated;
create policy barbers_read on public.barbers for select to authenticated
  using (private.actor_role(organization_id) in ('owner', 'admin', 'manager', 'receptionist'));

alter table public.weekly_hours enable row level security;
revoke all on public.weekly_hours from public, anon, authenticated, service_role;
grant select on public.weekly_hours to authenticated;
create policy weekly_hours_read on public.weekly_hours for select to authenticated
  using (private.actor_role(organization_id) in ('owner', 'admin', 'manager', 'receptionist'));

alter table public.appointments enable row level security;
revoke all on public.appointments from public, anon, authenticated, service_role;
grant select on public.appointments to authenticated;
create policy appointments_read on public.appointments for select to authenticated
  using (private.actor_role(organization_id) in ('owner', 'admin', 'manager', 'receptionist'));

grant insert (organization_id, name,email,phone,notes,archived), update (name,email,phone,notes,archived) on public.customers to authenticated;
create policy customers_insert on public.customers for insert to authenticated
  with check (private.actor_role(organization_id) in ('owner', 'admin', 'manager', 'receptionist'));
create policy customers_update on public.customers for update to authenticated
  using (private.actor_role(organization_id) in ('owner', 'admin', 'manager', 'receptionist'))
  with check (private.actor_role(organization_id) in ('owner', 'admin', 'manager', 'receptionist'));

grant insert (organization_id, name,duration_minutes,price_cents,active), update (name,duration_minutes,price_cents,active) on public.services to authenticated;
create policy services_insert on public.services for insert to authenticated
  with check (private.actor_role(organization_id) in ('owner', 'admin', 'manager'));
create policy services_update on public.services for update to authenticated
  using (private.actor_role(organization_id) in ('owner', 'admin', 'manager'))
  with check (private.actor_role(organization_id) in ('owner', 'admin', 'manager'));

grant insert (organization_id, name,active), update (name,active) on public.barbers to authenticated;
create policy barbers_insert on public.barbers for insert to authenticated
  with check (private.actor_role(organization_id) in ('owner', 'admin', 'manager'));
create policy barbers_update on public.barbers for update to authenticated
  using (private.actor_role(organization_id) in ('owner', 'admin', 'manager'))
  with check (private.actor_role(organization_id) in ('owner', 'admin', 'manager'));

grant insert (organization_id, barber_id,weekday,opens_at,closes_at), update (barber_id,weekday,opens_at,closes_at) on public.weekly_hours to authenticated;
create policy weekly_hours_insert on public.weekly_hours for insert to authenticated
  with check (private.actor_role(organization_id) in ('owner', 'admin', 'manager'));
create policy weekly_hours_update on public.weekly_hours for update to authenticated
  using (private.actor_role(organization_id) in ('owner', 'admin', 'manager'))
  with check (private.actor_role(organization_id) in ('owner', 'admin', 'manager'));
grant delete on public.weekly_hours to authenticated;
create policy weekly_hours_delete on public.weekly_hours for delete to authenticated
  using (private.actor_role(organization_id) in ('owner', 'admin', 'manager'));

create function private.book_appointment(p_org uuid, p_customer uuid, p_service uuid, p_barber uuid, p_start timestamp, p_existing uuid default null)
returns uuid language plpgsql security definer set search_path = ''
as $$
declare
  v_org public.organizations;
  v_service public.services;
  v_start timestamptz;
  v_end timestamptz;
  v_local_end timestamp;
  v_id uuid;
  v_duration integer;
  v_existing public.appointments;
begin
  if not coalesce(private.actor_role(p_org) in ('owner','admin','manager','receptionist'), false) then
    raise exception 'Booking forbidden' using errcode = '42501';
  end if;

  select * into strict v_org from public.organizations where id = p_org;
  select * into v_service from public.services where organization_id = p_org and id = p_service and active for share;
  if not found then
    raise exception 'Service unavailable' using errcode = '22023';
  end if;
  perform 1 from public.customers where organization_id = p_org and id = p_customer and not archived for share;
  if not found then
    raise exception 'Customer unavailable' using errcode = '22023';
  end if;
  perform 1 from public.barbers where organization_id = p_org and id = p_barber and active for share;
  if not found then
    raise exception 'Barber unavailable' using errcode = '22023';
  end if;

  v_duration := v_service.duration_minutes;
  if p_existing is not null then
    select * into v_existing from public.appointments
      where organization_id = p_org and id = p_existing
        and status in ('pending', 'confirmed') and starts_at > statement_timestamp()
      for update;
    if not found or v_existing.customer_id <> p_customer or v_existing.service_id <> p_service
      or v_existing.barber_id <> p_barber then
      raise exception 'Appointment cannot be rescheduled' using errcode = '22023';
    end if;
    v_duration := (extract(epoch from (v_existing.ends_at - v_existing.starts_at)) / 60)::integer;
  end if;

  v_start := p_start at time zone v_org.timezone;
  v_end := v_start + make_interval(mins => v_duration);
  v_local_end := p_start + make_interval(mins => v_duration);
  if p_start is null or p_start is distinct from (v_start at time zone v_org.timezone)
    or p_start = ((v_start - interval '1 hour') at time zone v_org.timezone)
    or p_start = ((v_start + interval '1 hour') at time zone v_org.timezone)
    or v_local_end is distinct from (v_end at time zone v_org.timezone)
    or v_start < statement_timestamp() or v_start > statement_timestamp() + interval '1 year' then
    raise exception 'Invalid local booking time' using errcode = '22023';
  end if;

  if exists (
    select 1 from (values (null::uuid), (p_barber)) as required_hours(barber_id)
    where not exists (
      select 1 from public.weekly_hours h
      where h.organization_id = p_org and h.barber_id is not distinct from required_hours.barber_id
        and h.weekday = extract(isodow from p_start)
        and p_start >= p_start::date + h.opens_at and v_local_end <= p_start::date + h.closes_at
    )
  ) then
    raise exception 'Outside working hours' using errcode = '22023';
  end if;

  if p_existing is not null then
    update public.appointments set starts_at = v_start, ends_at = v_end where id = p_existing;
    insert into private.audit_events(organization_id, actor_id, action, target_id)
      values (p_org, auth.uid(), 'appointment.rescheduled', p_existing);
    return p_existing;
  end if;

  insert into public.appointments(organization_id, customer_id, service_id, barber_id,
    service_name, quoted_price_cents, currency, starts_at, ends_at)
  values (p_org, p_customer, p_service, p_barber, v_service.name, v_service.price_cents, v_org.currency, v_start, v_end)
  returning id into v_id;
  insert into private.audit_events(organization_id, actor_id, action, target_id)
    values (p_org, auth.uid(), 'appointment.created', v_id);
  return v_id;
end;
$$;

create function private.set_appointment_status(p_org uuid, p_id uuid, p_status public.appointment_status)
returns void language plpgsql security definer set search_path = ''
as $$
begin
  if not coalesce(private.actor_role(p_org) in ('owner','admin','manager','receptionist'), false) then
    raise exception 'Status update forbidden' using errcode = '42501';
  end if;
  update public.appointments set status = p_status
    where organization_id = p_org and id = p_id and status in ('pending','confirmed') and status <> p_status
      and (p_status = 'cancelled' or (p_status = 'confirmed' and status = 'pending')
        or (p_status in ('completed','no_show') and starts_at <= statement_timestamp()));
  if not found then
    raise exception 'Invalid status transition' using errcode = '22023';
  end if;
  insert into private.audit_events(organization_id, actor_id, action, target_id)
    values (p_org, auth.uid(), 'appointment.' || p_status::text, p_id);
end;
$$;

create function public.book_appointment(p_org uuid, p_customer uuid, p_service uuid, p_barber uuid, p_start timestamp, p_existing uuid default null)
returns uuid language sql security invoker set search_path = ''
as $$ select private.book_appointment(p_org, p_customer, p_service, p_barber, p_start, p_existing); $$;
create function public.set_appointment_status(p_org uuid, p_id uuid, p_status public.appointment_status)
returns void language sql security invoker set search_path = ''
as $$ select private.set_appointment_status(p_org, p_id, p_status); $$;
revoke execute on function private.book_appointment(uuid, uuid, uuid, uuid, timestamp, uuid),
  public.book_appointment(uuid, uuid, uuid, uuid, timestamp, uuid),
  private.set_appointment_status(uuid, uuid, public.appointment_status),
  public.set_appointment_status(uuid, uuid, public.appointment_status)
  from public, anon, authenticated, service_role;
grant execute on function private.book_appointment(uuid, uuid, uuid, uuid, timestamp, uuid),
  public.book_appointment(uuid, uuid, uuid, uuid, timestamp, uuid),
  private.set_appointment_status(uuid, uuid, public.appointment_status),
  public.set_appointment_status(uuid, uuid, public.appointment_status) to authenticated;
commit;
