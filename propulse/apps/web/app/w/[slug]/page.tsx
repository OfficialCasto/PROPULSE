import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Building2, CalendarDays, UsersRound } from "lucide-react";
import { roleLabels } from "@propulse/shared";
import { WorkShell } from "@/components/shell";
import { requireWorkspace } from "@/lib/workspace";

export default async function WorkspacePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { organization, role } = await requireWorkspace(slug);
  return <WorkShell>
    <Link href="/workspaces" className="back-link"><ArrowLeft size={16} aria-hidden="true" /> Negócios</Link>
    <div className="page-title"><div><h1>{organization.name}</h1><p>O seu papel é {roleLabels[role].toLocaleLowerCase("pt-PT")}.</p></div></div>
    <div className="workspace-grid">
      {["owner", "admin", "manager", "receptionist"].includes(role) && <Link className="workspace-card align-start" href={`/w/${slug}/gestao/indicadores`}>
        <span className="workspace-icon"><CalendarDays size={20} aria-hidden="true" /></span>
        <div><strong>Gestão do negócio</strong><span>Agenda, clientes, serviços e horários.</span></div>
        <ArrowUpRight size={16} aria-hidden="true" className="card-arrow" />
      </Link>}
      <section className="panel">
        <div className="section-heading"><Building2 size={19} aria-hidden="true" /><h2>Dados do espaço</h2></div>
        <dl className="details">
          <div><dt>Identificador</dt><dd>{organization.slug}</dd></div>
          <div><dt>Fuso horário</dt><dd>{organization.timezone}</dd></div>
          <div><dt>Moeda</dt><dd>{organization.currency}</dd></div>
        </dl>
      </section>
      {(role === "owner" || role === "admin") && <Link className="workspace-card align-start" href={`/w/${slug}/equipa`}>
        <span className="workspace-icon"><UsersRound size={20} aria-hidden="true" /></span>
        <div><strong>Equipa</strong><span>Gira membros, papéis e convites.</span></div>
        <ArrowUpRight size={16} aria-hidden="true" className="card-arrow" />
      </Link>}
    </div>
  </WorkShell>;
}
