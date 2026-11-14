import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";
import { AccessShell } from "@/components/shell";
import { ActionForm, Field } from "@/components/forms";
import { authAction } from "@/lib/actions";
import { readConfig, requireUser } from "@/lib/supabase";

const modes = {
  login: ["Iniciar sessão", "Entre para abrir o espaço de trabalho do seu negócio.", "Entrar"],
  registo: ["Criar conta", "Uma conta para gerir os seus espaços de trabalho.", "Criar conta"],
  recuperar: ["Recuperar acesso", "Indique o email da sua conta para receber a ligação de recuperação.", "Enviar ligação"],
  "nova-palavra-passe": ["Nova palavra-passe", "Escolha uma nova palavra-passe para a sua conta.", "Guardar palavra-passe"],
} as const;

export default async function AccessPage({ params, searchParams }: {
  params: Promise<{ mode: string }>; searchParams: Promise<{ next?: string | string[] }>;
}) {
  const { mode } = await params;
  if (!Object.hasOwn(modes, mode)) notFound();
  if (!readConfig()) redirect("/setup");
  if (mode === "nova-palavra-passe") {
    const { user } = await requireUser();
    if ((await cookies()).get("propulse_recovery")?.value !== user.id) redirect("/access/recuperar");
  }
  const nextParam = (await searchParams).next;
  const next = typeof nextParam === "string" && /^\/join\?token=[0-9a-f]{64}$/.test(nextParam) ? nextParam : "";
  const nextQuery = next ? `?next=${encodeURIComponent(next)}` : "";
  const [title, subtitle, label] = modes[mode as keyof typeof modes];
  return <AccessShell title={title} subtitle={subtitle}>
    <ActionForm action={authAction.bind(null, mode)} label={label}>
      {next && <input type="hidden" name="next" value={next} />}
      {mode === "registo" && <Field label="Nome" name="fullName" autoComplete="name" required maxLength={120} />}
      {mode !== "nova-palavra-passe" && <Field label="Email" name="email" type="email" autoComplete="email" required maxLength={254} />}
      {mode !== "recuperar" && <Field label="Palavra-passe" name="password" type="password" required
        autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={mode === "login" ? undefined : 12} />}
      {mode === "login" && <Link href="/access/recuperar" className="text-link">Esqueci-me da palavra-passe</Link>}
    </ActionForm>
    <p className="auth-footer">{mode === "login" ? "Ainda não tem conta? " : ""}
      <Link className="text-link" href={mode === "login" ? `/access/registo${nextQuery}` : `/access/login${nextQuery}`}>
        {mode === "login" ? "Criar conta" : "Voltar ao início de sessão"}
      </Link>
    </p>
  </AccessShell>;
}
