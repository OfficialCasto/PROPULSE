import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { after, before, test } from "node:test";
import { PGlite } from "@electric-sql/pglite";

import { btree_gist } from "@electric-sql/pglite/contrib/btree_gist";

const db = new PGlite({ extensions: { btree_gist } });
const users = {
  ownerA: "10000000-0000-4000-8000-000000000001",
  ownerB: "10000000-0000-4000-8000-000000000002",
  barber: "10000000-0000-4000-8000-000000000003",
  admin: "10000000-0000-4000-8000-000000000004",
  unverified: "10000000-0000-4000-8000-000000000005",
};
let orgA: string;
let orgB: string;
let barberId: string;

async function actor(id: string) {
  await db.exec("reset role; set role authenticated;");
  await db.query("select set_config('request.jwt.claim.sub', $1, false)", [id]);
}

async function scalar(sql: string, args: unknown[] = []) {
  const { rows } = await db.query<{ value: string }>(sql, args);
  return rows[0]?.value;
}

const createOrganization = "select public.create_organization($1, $2, '', '', '') as value";
const createInvite = "select public.create_invitation($1, $2, $3) as value";
const acceptInvite = "select public.accept_invitation($1) as value";
const changeRole = "select public.set_member_role($1, $2, $3)";

before(async () => {
  // Stand-in Auth schema only. The migration, RLS and role checks execute in PostgreSQL.
  await db.exec(`
    create role anon nologin;
    create role authenticated nologin;
    create role service_role nologin bypassrls;
    create schema auth;
    grant usage on schema auth to authenticated, anon;
    create table auth.users (id uuid primary key, email text, email_confirmed_at timestamptz, raw_user_meta_data jsonb);
    create function auth.uid() returns uuid language sql stable as
      $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  `);
  const migrations = new URL("../supabase/migrations/", import.meta.url);
  for (const name of (await readdir(migrations)).filter((name) => name.endsWith(".sql")).sort()) {
    await db.exec(await readFile(new URL(name, migrations), "utf8"));
  }
  for (const [name, id] of Object.entries(users)) {
    await db.query("insert into auth.users values ($1, $2, $3, $4)", [
      id, `${name.toLowerCase()}@example.com`, name === "unverified" ? null : new Date().toISOString(),
      JSON.stringify({ full_name: name, role: "owner" }),
    ]);
  }
  await actor(users.ownerA);
  orgA = (await scalar(createOrganization, ["Primeira", "primeira"]))!;
  await actor(users.ownerB);
  orgB = (await scalar(createOrganization, ["Segunda", "segunda"]))!;
});

after(async () => { await db.close(); });

test("anonymous cannot enumerate or mutate tenant data", async () => {
  await db.exec("reset role; set role anon");
  await assert.rejects(db.query("select * from public.organizations"), { code: "42501" });
  await assert.rejects(db.query(createOrganization, ["Anon", "anonima"]), { code: "42501" });
});

test("unverified identity cannot create a workspace", async () => {
  await actor(users.unverified);
  await assert.rejects(db.query(createOrganization, ["No", "no-verify"]), { code: "42501" });
});

test("tenant reads, profile reads and direct mutations are isolated", async () => {
  await actor(users.ownerA);
  assert.equal(await scalar("select count(*)::text as value from public.organizations"), "1");
  assert.equal(await scalar("select id as value from public.organizations where id = $1", [orgB]), undefined);
  assert.equal(await scalar("select id as value from public.profiles where id = $1", [users.ownerB]), undefined);
  assert.equal(await scalar("select id as value from public.memberships where organization_id = $1", [orgB]), undefined);
  await assert.rejects(db.query(createInvite, [orgB, "barber@example.com", "barber"]), { code: "42501" });
  await assert.rejects(db.query("update public.memberships set role='admin' where organization_id=$1", [orgA]), { code: "42501" });
  await assert.rejects(db.query("select * from private.audit_events"), { code: "42501" });
  await assert.rejects(db.query(createOrganization, ["Conflito", "segunda"]), { code: "23505" });
});

test("SQL-looking organization names remain literal input", async () => {
  await actor(users.ownerA);
  const before = Number(await scalar("select count(*)::text as value from public.organizations"));
  const payload = "O' OR '1'='1' --";
  const id = await scalar(createOrganization, [payload, "sql-probe-barbershop"]);

  assert.ok(id);
  assert.equal(await scalar("select name as value from public.organizations where id = $1", [id]), payload);
  assert.equal(Number(await scalar("select count(*)::text as value from public.organizations")), before + 1);
});

test("invites bind confirmed email and cannot be replayed or read as raw tokens", async () => {
  await actor(users.ownerA);
  const token = (await scalar(createInvite, [orgA, " BARBER@EXAMPLE.COM ", "barber"]))!;
  assert.match(token, /^[a-f0-9]{64}$/);
  await assert.rejects(db.query("select token_hash from public.invitations"), { code: "42501" });
  await actor(users.ownerB);
  await assert.rejects(db.query(acceptInvite, [token]), { code: "42501" });
  await actor(users.barber);
  assert.equal(await scalar(acceptInvite, [token]), orgA);
  await assert.rejects(db.query(acceptInvite, [token]), { code: "42501" });
  barberId = (await scalar("select id as value from public.memberships where organization_id = $1 and user_id = $2", [orgA, users.barber]))!;
  assert.equal(await scalar("select role as value from public.memberships where id=$1", [barberId]), "barber");
  assert.equal(await scalar("select count(id)::text as value from public.invitations"), "0");
  assert.equal(await scalar("select count(*)::text as value from public.memberships"), "1");
  await assert.rejects(db.query(createInvite, [orgA, "third@example.com", "barber"]), { code: "42501" });
});

test("owner grants admin, admin updates junior role, owner stays protected", async () => {
  await actor(users.ownerA);
  const ownerId = await scalar("select id as value from public.memberships where role='owner'");
  await assert.rejects(db.query(changeRole, [orgA, ownerId, "manager"]), { code: "42501" });
  await assert.rejects(db.query(createInvite, [orgA, "admin@example.com", "owner"]), { code: "42501" });
  const token = await scalar(createInvite, [orgA, "admin@example.com", "admin"]);
  await actor(users.admin);
  await db.query(acceptInvite, [token]);
  await assert.rejects(db.query(createInvite, [orgA, "extra@example.com", "admin"]), { code: "42501" });
  await assert.rejects(db.query(changeRole, [orgA, barberId, "admin"]), { code: "42501" });
  await assert.rejects(db.query(changeRole, [orgA, ownerId, "barber"]), { code: "42501" });
  await db.query(changeRole, [orgA, barberId, "manager"]);
  assert.equal(await scalar("select role as value from public.memberships where id=$1", [barberId]), "manager");
  await db.exec("reset role");
  assert.equal(await scalar("select count(*)::text as value from private.audit_events where action='membership.role_changed'"), "1");
});

test("revoked, superseded and expired invitations cannot be accepted", async () => {
  await actor(users.ownerA);
  const old = await scalar(createInvite, [orgA, "ownerb@example.com", "barber"]);
  const fresh = await scalar(createInvite, [orgA, "ownerb@example.com", "barber"]);
  const current = await scalar("select id as value from public.invitations where email='ownerb@example.com' and revoked_at is null");
  await db.query("select public.revoke_invitation($1, $2)", [orgA, current]);
  const expired = await scalar(createInvite, [orgA, "ownerb@example.com", "barber"]);
  await db.exec("reset role; update public.invitations set expires_at = now() - interval '1 second' where email='ownerb@example.com' and revoked_at is null;");
  await actor(users.ownerB);
  for (const token of [old, fresh, expired]) await assert.rejects(db.query(acceptInvite, [token]), { code: "42501" });
});

test("operations isolate tenants and reserve a barber only once per interval", async () => {
  await actor(users.ownerB);
  const otherCustomer = await scalar(
    "insert into public.customers(organization_id,name) values ($1,'Foreign client') returning id as value", [orgB],
  );
  await actor(users.ownerA);
  const customer = await scalar(
    "insert into public.customers(organization_id,name) values ($1,'Local client') returning id as value", [orgA],
  );
  const service = await scalar(
    "insert into public.services(organization_id,name,duration_minutes,price_cents) values ($1,'Corte',30,1800) returning id as value", [orgA],
  );
  const barber = await scalar(
    "insert into public.barbers(organization_id,name) values ($1,'Local barber') returning id as value", [orgA],
  );
  const when = await scalar("select to_char((now() at time zone 'Europe/Lisbon')::date + 3, 'YYYY-MM-DD') as value");
  const weekday = await scalar("select extract(isodow from $1::date)::text as value", [when]);
  const book = "select public.book_appointment($1,$2,$3,$4,$5) as value";
  await assert.rejects(db.query(book, [orgA, customer, service, barber, when + "T10:00"]), { code: "22023" });
  await db.query("insert into public.weekly_hours(organization_id,barber_id,weekday,opens_at,closes_at) values ($1,null,$2,'09:00','18:00'),($1,$3,$2,'09:00','12:00'),($1,$3,$2,'13:00','18:00')", [orgA, weekday, barber]);
  await assert.rejects(db.query(book, [orgA, otherCustomer, service, barber, when + "T10:00"]), { code: "22023" });
  await assert.rejects(db.query(book, [orgA, customer, service, barber, when + "T11:45"]), { code: "22023" });
  const id = await scalar(book, [orgA, customer, service, barber, when + "T10:00"]);
  assert.ok(id);
  await assert.rejects(db.query(book, [orgA, customer, service, barber, when + "T10:15"]), { code: "23P01" });
  assert.ok(await scalar(book, [orgA, customer, service, barber, when + "T10:30"]));
  const reschedule = "select public.book_appointment($1,$2,$3,$4,$5,$6) as value";
  await assert.rejects(db.query(reschedule, [orgA, customer, service, barber, when + "T10:45", id]), { code: "23P01" });
  assert.equal(await scalar("select to_char(starts_at at time zone 'Europe/Lisbon', 'HH24:MI') as value from public.appointments where id=$1", [id]), "10:00");
  assert.equal(await scalar(reschedule, [orgA, customer, service, barber, when + "T11:00", id]), id);
  await assert.rejects(db.query("select public.set_appointment_status($1,$2,'completed')", [orgA, id]), { code: "22023" });
  await db.query("select public.set_appointment_status($1,$2,'cancelled')", [orgA, id]);
  assert.ok(await scalar(book, [orgA, customer, service, barber, when + "T10:00"]));
  await actor(users.ownerB);
  assert.equal(await scalar("select count(*)::text as value from public.appointments"), "0");
  await assert.rejects(db.query(book, [orgA, customer, service, barber, when + "T11:00"]), { code: "42501" });
});