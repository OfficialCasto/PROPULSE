import Link from "next/link";
import { AccessShell } from "@/components/shell";
import { ActionForm } from "@/components/forms";
import { confirmEmail } from "@/lib/actions";

export default async function ConfirmPage({ searchParams }: {
  searchParams: Promise<{ token_hash?: string | string[]; type?: string | string[] }>;
}) {
  const { token_hash, type } = await searchParams;
  const valid = typeof token_hash === "string" && /^(?:pkce_)?[0-9a-f]{56}$/i.test(token_hash) && (type === "email" || type === "recovery");
  return <AccessShell title={type === "recovery" ? "Confirmar recuperação" : "Confirmar email"}
    subtitle={valid ? "Confirme que pretende continuar com esta ligação." : "Esta ligação de acesso é inválida."}>
    {valid ? <ActionForm action={confirmEmail} label="Confirmar">
      <input type="hidden" name="token_hash" value={token_hash} /><input type="hidden" name="type" value={type} />
    </ActionForm> : <Link className="text-link" href="/access/login">Iniciar sessão</Link>}
  </AccessShell>;
}
