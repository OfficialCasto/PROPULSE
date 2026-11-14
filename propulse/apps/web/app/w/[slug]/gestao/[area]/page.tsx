import Link from "next/link";
import type { ComponentProps } from "react";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { ActionForm } from "@/components/forms";
import { WorkShell } from "@/components/shell";
import { Input, buttonVariants } from "@/components/ui";
import { operation } from "@/lib/operations";
import { requireWorkspace } from "@/lib/workspace";
import { appointmentLabels } from "@propulse/shared";

const titles = {
  clientes: "Clientes", servicos: "Serviços", barbeiros: "Profissionais", horarios: "Horários", agenda: "Agenda",
} as const;
const days = ["Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado", "Domingo"];
const operators = ["owner", "admin", "manager", "receptionist"];
const limit = 30;

function Field({ label, ...props }: ComponentProps<typeof Input> & { label: string }) {
  return <label className="field"><span>{label}</span><Input {...props} /></label>;
}

function Select({ label, name, options, defaultValue }: {
  label: string; name: string; options: readonly (readonly [string, string])[]; defaultValue?: string;
}) {
  return <label className="field"><span>{label}</span>
    <select className="input" name={name} defaultValue={defaultValue}>
      {options.map(([value, title]) => <option key={value} value={value}>{title}</option>)}
    </select>
  </label>;
}

function Flag({ name, selected }: { name: "active" | "archived"; selected: boolean }) {
  return <Select label="Estado" name={name} defaultValue={String(selected)} options={name === "archived"
    ? [["false", "Ativo"], ["true", "Arquivado"]] : [["true", "Ativo"], ["false", "Inativo"]]} />;
}

export default async function OperationsPage({ params, searchParams }: {
  params: Promise<{ slug: string; area: string }>;
  searchParams: Promise<{ pagina?: string; nome?: string }>;
}) {
  const { slug, area } = await params;
  if (!Object.hasOwn(titles, area)) notFound();
  const { client, organization, role } = await requireWorkspace(slug);
  if (!operators.includes(role)) notFound();
  const title = titles[area as keyof typeof titles];
  const manage = role !== "receptionist";
  const base = `/w/${slug}/gestao/${area}`;
  const { pagina, nome } = await searchParams;
  const page = Number(pagina ?? "1");
  if (!Number.isInteger(page) || page < 1 || page > 1000) notFound();
  const name = typeof nome === "string" ? nome.trim().slice(0, 120) : "";
  const first = (page - 1) * limit;
  const last = first + limit;
  const formatMoney = (cents: number) => new Intl.NumberFormat("pt-PT", { style: "currency", currency: organization.currency }).format(cents / 100);
  const act = operation.bind(null, slug, area);
  let content;
  let next = false;

  if (area === "clientes") {
    const query = client.from("customers").select("id,name,email,phone,notes,archived")
      .eq("organization_id", organization.id).order("name").order("id").range(first, last);
    if (name) query.ilike("name", `%${name.replace(/[\\%_]/g, "\\$&")}%`);
    const { data, error } = await query;
    if (error) throw error;
    next = data.length > limit;
    const customerFields = (row?: typeof data[number]) => <>
      <Field label="Nome" name="name" required maxLength={120} defaultValue={row?.name} />
      <Field label="Email" name="email" type="email" maxLength={254} defaultValue={row?.email ?? ""} />
      <Field label="Telefone" name="phone" type="tel" maxLength={32} defaultValue={row?.phone ?? ""} />
      <label className="field"><span>Notas</span><textarea className="input" name="notes" rows={3} maxLength={2000} defaultValue={row?.notes} /></label>
      <Flag name="archived" selected={row?.archived ?? false} />
    </>;
    content = <div className="team-grid">
      <section className="panel"><h2>Novo cliente</h2><ActionForm action={act} label="Criar cliente">{customerFields()}</ActionForm></section>
      <section className="panel"><h2>Lista de clientes</h2>
        <form action={base} className="form ops-filter"><Field label="Pesquisar por nome" name="nome" defaultValue={name} />
          <button type="submit" className={buttonVariants({ variant: "outline" })}>Pesquisar</button></form>
        {!data.length && <p className="muted">Nenhum cliente encontrado.</p>}
        {data.slice(0, limit).map((row) => <details key={row.id} className="ops-record">
          <summary>{row.name}{row.archived && " · Arquivado"}</summary>
          <ActionForm action={act} label="Guardar cliente" compact>
            <input type="hidden" name="id" value={row.id} />{customerFields(row)}
          </ActionForm>
        </details>)}
      </section>
    </div>;
  } else if (area === "servicos" || area === "barbeiros") {
    const service = area === "servicos";
    const { data, error } = await client.from(service ? "services" : "barbers").select("*")
      .eq("organization_id", organization.id).order("name").order("id").range(first, last);
    if (error) throw error;
    next = data.length > limit;
    const fields = (row?: typeof data[number]) => <>
      <Field label="Nome" name="name" required maxLength={120} defaultValue={row?.name} />
      {service && <>
        <Field label="Duração em minutos" name="duration_minutes" type="number" required min={5} max={480}
          defaultValue={row && "duration_minutes" in row ? row.duration_minutes : 30} />
        <Field label={`Preço em ${organization.currency}`} name="price" inputMode="decimal" required
          defaultValue={row && "price_cents" in row ? (row.price_cents / 100).toFixed(2) : undefined} />
      </>}
      <Flag name="active" selected={row?.active ?? true} />
    </>;
    content = <div className="team-grid">
      {manage && <section className="panel"><h2>{service ? "Novo serviço" : "Novo profissional"}</h2>
        <ActionForm action={act} label={service ? "Criar serviço" : "Adicionar profissional"}>{fields()}</ActionForm>
      </section>}
      <section className="panel"><h2>{title} registados</h2>
        {!data.length && <p className="muted">Ainda não existem registos.</p>}
        {data.slice(0, limit).map((row) => {
          const caption = `${row.name}${"price_cents" in row ? ` · ${row.duration_minutes} min · ${formatMoney(row.price_cents)}` : ""}${row.active ? "" : " · Inativo"}`;
          return manage ? <details key={row.id} className="ops-record"><summary>{caption}</summary>
            <ActionForm action={act} label="Guardar alterações" compact><input type="hidden" name="id" value={row.id} />{fields(row)}</ActionForm>
          </details> : <p className="ops-record" key={row.id}>{caption}</p>;
        })}
      </section>
    </div>;
  } else if (area === "horarios") {
    const [hours, barbers] = await Promise.all([
      client.from("weekly_hours").select("*").eq("organization_id", organization.id).order("weekday").order("opens_at").order("id").range(first, last),
      client.from("barbers").select("id,name").eq("organization_id", organization.id).order("name").limit(500),
    ]);
    if (hours.error) throw hours.error;
    if (barbers.error) throw barbers.error;
    next = hours.data.length > limit;
    const names = new Map(barbers.data.map((row) => [row.id, row.name]));
    content = <div className="team-grid">
      {manage && <section className="panel"><h2>Novo período semanal</h2>
        <p className="muted">Adicione períodos ao negócio e a cada profissional. Para uma pausa, crie um período antes e outro depois.</p>
        <ActionForm action={act} label="Adicionar período">
          <Select name="barber_id" label="Horário de" options={[["", "Negócio"], ...barbers.data.map((row) => [row.id, row.name] as const)]} />
          <Select name="weekday" label="Dia da semana" options={days.map((day, index) => [String(index + 1), day])} />
          <Field label="Início" name="opens_at" type="time" required /><Field label="Fim" name="closes_at" type="time" required />
        </ActionForm>
      </section>}
      <section className="panel"><h2>Períodos configurados</h2>
        {!hours.data.length && <p className="muted">Ainda não existem horários.</p>}
        {hours.data.slice(0, limit).map((row) => <div key={row.id} className="ops-record">
          <strong>{days[row.weekday - 1]} · {row.opens_at.slice(0, 5)}–{row.closes_at.slice(0, 5)}</strong>
          <p className="muted">{row.barber_id ? names.get(row.barber_id) ?? "Profissional" : "Negócio"}</p>
          {manage && <ActionForm action={act} label="Remover período" variant="outline" compact><input type="hidden" name="id" value={row.id} /></ActionForm>}
        </div>)}
      </section>
    </div>;
  } else {
    const [appointments, customers, services, barbers] = await Promise.all([
      client.from("appointments").select("*, customer:customers(name), barber:barbers(name)")
        .eq("organization_id", organization.id).order("starts_at", { ascending: false }).order("id").range(first, last),
      client.from("customers").select("id,name").eq("organization_id", organization.id).eq("archived", false).order("name").limit(500),
      client.from("services").select("id,name").eq("organization_id", organization.id).eq("active", true).order("name").limit(500),
      client.from("barbers").select("id,name").eq("organization_id", organization.id).eq("active", true).order("name").limit(500),
    ]);
    if (appointments.error) throw appointments.error;
    if (customers.error) throw customers.error;
    if (services.error) throw services.error;
    if (barbers.error) throw barbers.error;
    next = appointments.data.length > limit;
    const options = (rows: { id: string; name: string }[]) => rows.map((row) => [row.id, row.name] as const);
    const formatter = new Intl.DateTimeFormat("pt-PT", { dateStyle: "medium", timeStyle: "short", timeZone: organization.timezone });
    await connection();
    const now = new Date();
    content = <div className="team-grid">
      <section className="panel"><h2>Nova marcação</h2><p className="muted">Hora local · {organization.timezone}</p>
        {customers.data.length && services.data.length && barbers.data.length ? <ActionForm action={act} label="Confirmar marcação">
          <Select name="p_customer" label="Cliente" options={options(customers.data)} />
          <Select name="p_service" label="Serviço" options={options(services.data)} />
          <Select name="p_barber" label="Profissional" options={options(barbers.data)} />
          <Field label="Data e hora" name="p_start" type="datetime-local" required />
        </ActionForm> : <p className="muted">Adicione um cliente, um serviço e um profissional ativos para marcar.</p>}
      </section>
      <section className="panel"><h2>Marcações</h2>
        {!appointments.data.length && <p className="muted">Ainda não existem marcações.</p>}
        {appointments.data.slice(0, limit).map((row) => {
          const transitions: [string, string][] = [["cancelled", "Cancelar"]];
          if (row.status === "pending") transitions.unshift(["confirmed", "Confirmar"]);
          if (new Date(row.starts_at) <= now) transitions.unshift(["completed", "Concluir"], ["no_show", "Registar falta"]);
          return <div key={row.id} className="ops-record">
            <strong>{formatter.format(new Date(row.starts_at))} · {row.service_name}</strong>
            <p className="muted">{row.customer?.name} · {row.barber?.name} · {appointmentLabels[row.status]}</p>
            {new Date(row.starts_at) > now && (row.status === "confirmed" || row.status === "pending") &&
              <details className="ops-record"><summary>Reagendar</summary>
                <ActionForm action={operation.bind(null, slug, "reagendar")} label="Guardar novo horário" compact>
                  <input type="hidden" name="id" value={row.id} />
                  <input type="hidden" name="p_customer" value={row.customer_id} />
                  <input type="hidden" name="p_service" value={row.service_id} />
                  <input type="hidden" name="p_barber" value={row.barber_id} />
                  <Field label="Nova data e hora" name="p_start" type="datetime-local" required />
                </ActionForm>
              </details>}
            {(row.status === "confirmed" || row.status === "pending") && <ActionForm action={act} label="Atualizar marcação" compact variant="outline">
              <input type="hidden" name="id" value={row.id} />
              <Select label="Alterar estado" name="status" options={transitions} />
            </ActionForm>}
          </div>;
        })}
      </section>
    </div>;
  }

  function pageUrl(target: number) {
    const search = new URLSearchParams({ pagina: String(target) });
    if (name) search.set("nome", name);
    return `${base}?${search}`;
  }

  return <WorkShell>
    <Link className="back-link" href={`/w/${slug}`}>{organization.name}</Link>
    <nav className="ops-nav" aria-label="Gestão do negócio">
      {Object.entries(titles).map(([key, label]) => <Link aria-current={key === area ? "page" : undefined}
        className={buttonVariants({ variant: key === area ? "primary" : "outline" })} key={key} href={`/w/${slug}/gestao/${key}`}>{label}</Link>)}
    </nav>
    <div className="page-title"><h1>{title}</h1></div>
    {content}
    {(page > 1 || next) && <nav className="ops-nav ops-pagination" aria-label="Páginas">
      {page > 1 && <Link href={pageUrl(page - 1)} className={buttonVariants({ variant: "outline" })}>Anterior</Link>}
      {next && page < 1000 && <Link href={pageUrl(page + 1)} className={buttonVariants({ variant: "outline" })}>Seguinte</Link>}
    </nav>}
  </WorkShell>;
}
