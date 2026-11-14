import Link from "next/link";
import { notFound } from "next/navigation";
import { WorkShell } from "@/components/shell";
import { buttonVariants } from "@/components/ui";
import { requireWorkspace } from "@/lib/workspace";

export default async function Indicators({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { client, organization, role } = await requireWorkspace(slug);
  if (!["owner", "admin", "manager", "receptionist"].includes(role)) notFound();

  const count = { count: "exact", head: true } as const;
  const id = organization.id;
  const cards = [
    { title: "Clientes ativos", href: "clientes", query: client.from("customers").select("id", count).eq("organization_id", id).eq("archived", false) },
    { title: "Serviços ativos", href: "servicos", query: client.from("services").select("id", count).eq("organization_id", id).eq("active", true) },
    { title: "Marcações confirmadas", href: "agenda", query: client.from("appointments").select("id", count).eq("organization_id", id).eq("status", "confirmed") },
    { title: "Marcações concluídas", href: "agenda", query: client.from("appointments").select("id", count).eq("organization_id", id).eq("status", "completed") },
  ];
  const results = await Promise.all(cards.map(({ query }) => query));
  const error = results.find((result) => result.error)?.error;
  if (error) throw error;

  return <WorkShell>
    <Link className="back-link" href={`/w/${slug}`}>{organization.name}</Link>
    <div className="page-title"><div><h1>Indicadores</h1><p>Totais atuais de {organization.name}.</p></div>
      <Link className={buttonVariants()} href={`/w/${slug}/gestao/agenda`}>Abrir agenda</Link>
    </div>
    <div className="workspace-grid">
      {cards.map(({ title, href }, index) => <Link className="workspace-card" key={title} href={`/w/${slug}/gestao/${href}`}>
        <div><span>{title}</span><strong className="ops-metric">{results[index]?.count ?? 0}</strong></div>
      </Link>)}
    </div>
  </WorkShell>;
}
