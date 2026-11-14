import Link from "next/link";
import { inviteTokenSchema } from "@propulse/shared";
import { ActionForm } from "@/components/forms";
import { AccessShell } from "@/components/shell";
import { acceptInvitation } from "@/lib/actions";
import { requireUser } from "@/lib/supabase";

export default async function JoinPage({ searchParams }: { searchParams: Promise<{ token?: string | string[] }> }) {
  const input = inviteTokenSchema.safeParse((await searchParams).token);
  if (!input.success) return <AccessShell title="Convite inválido" subtitle="Peça à sua equipa uma nova ligação.">
    <Link className="text-link" href="/workspaces">Os meus negócios</Link>
  </AccessShell>;
  const { user } = await requireUser(false, `/join?token=${input.data}`);
  return <AccessShell title="Convite para equipa" subtitle={`Aceite o convite com a sua conta ${user.email ?? ""}.`}>
    <ActionForm action={acceptInvitation} label="Aceitar convite"><input type="hidden" name="token" value={input.data} /></ActionForm>
  </AccessShell>;
}
