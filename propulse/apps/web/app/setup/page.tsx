import Link from "next/link";
import { AccessShell } from "@/components/shell";
import { buttonVariants } from "@/components/ui";
import { readConfig } from "@/lib/supabase";
import { redirect } from "next/navigation";

export default function SetupPage() {
  if (readConfig()) redirect("/access/login");
  return <AccessShell title="Configuração em falta" subtitle="O acesso fica disponível após ligar esta instalação ao Supabase.">
    <div className="setup-notice">No ambiente de desenvolvimento, preencha <code>apps/web/.env.local</code> a partir de <code>apps/web/.env.example</code> e reinicie a aplicação.</div>
    <Link className={buttonVariants({ variant: "outline" })} href="/">Voltar ao início</Link>
  </AccessShell>;
}
