import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { OrganizationForm } from "@/components/forms";
import { WorkShell } from "@/components/shell";
import { requireUser } from "@/lib/supabase";

export default async function CreateWorkspacePage() {
  await requireUser();
  return <WorkShell>
    <Link href="/workspaces" className="back-link"><ArrowLeft size={16} aria-hidden="true" /> Negócios</Link>
    <div className="page-title"><div><h1>Novo negócio</h1><p>Adicione os dados do negócio para criar o seu espaço de trabalho.</p></div></div>
    <section className="panel narrow" aria-label="Dados do negócio"><OrganizationForm /></section>
  </WorkShell>;
}
