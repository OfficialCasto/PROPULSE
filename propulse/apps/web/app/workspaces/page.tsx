import Link from "next/link";
import { ArrowUpRight, Building2, Plus } from "lucide-react";
import { roleLabels } from "@propulse/shared";
import { getWorkspaces } from "@propulse/database";
import { WorkShell } from "@/components/shell";
import { buttonVariants } from "@/components/ui";
import { requireUser } from "@/lib/supabase";

export default async function WorkspacesPage() {
  const { client, user } = await requireUser();
  const { data, error } = await getWorkspaces(client, user.id);
  if (error) throw error;
  return <WorkShell>
    <div className="page-title"><div><h1>Os meus negócios</h1><p>Escolha o espaço de trabalho que quer abrir.</p></div>
      <Link className={buttonVariants()} href="/workspaces/novo"><Plus size={17} aria-hidden="true" /> Novo negócio</Link>
    </div>
    {data?.length ? <div className="workspace-grid">{data.map(({ organization, role }) => organization &&
      <Link className="workspace-card" href={`/w/${organization.slug}`} key={organization.id}>
        <span className="workspace-icon"><Building2 size={20} aria-hidden="true" /></span>
        <div><strong>{organization.name}</strong><span>{roleLabels[role]}</span></div>
        <ArrowUpRight size={16} aria-hidden="true" className="card-arrow" />
      </Link>)}</div> : <section className="empty">
        <Building2 size={26} aria-hidden="true" /><h2>Ainda não tem negócios</h2>
        <p>Crie o seu espaço de trabalho ou abra a ligação de um convite da sua equipa.</p>
      </section>}
  </WorkShell>;
}
