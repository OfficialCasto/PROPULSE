import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { assignableRoles, canManageRole, roleLabels, type Role } from "@propulse/shared";
import { ActionForm, Field } from "@/components/forms";
import { WorkShell } from "@/components/shell";
import { teamAction } from "@/lib/actions";
import { requireWorkspace } from "@/lib/workspace";

function RoleSelect({ roles, current, label }: { roles: readonly Role[]; current?: Role; label: string }) {
  return <label className="field"><span>{label}</span><select className="input" name="role" defaultValue={current ?? "barber"}>
    {roles.map((role) => <option key={role} value={role}>{roleLabels[role]}</option>)}
  </select></label>;
}
const date = new Intl.DateTimeFormat("pt-PT", { dateStyle: "medium", timeZone: "Europe/Lisbon" });

export default async function TeamPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { client, user, organization, role } = await requireWorkspace(slug);
  if (role !== "owner" && role !== "admin") notFound();
  const [members, invitations] = await Promise.all([
    client.from("memberships").select("id,user_id,role,profile:profiles(full_name,email)").eq("organization_id", organization.id).order("created_at"),
    client.from("invitations").select("id,email,role,expires_at").eq("organization_id", organization.id)
      .is("accepted_at", null).is("revoked_at", null).gt("expires_at", new Date().toISOString()).order("created_at", { ascending: false }),
  ]);
  if (members.error) throw members.error;
  if (invitations.error) throw invitations.error;
  const available = assignableRoles.filter((target) => canManageRole(role, target));
  return <WorkShell>
    <Link href={`/w/${slug}`} className="back-link"><ArrowLeft size={16} aria-hidden="true" /> {organization.name}</Link>
    <div className="page-title"><div><h1>Equipa</h1><p>Gira os acessos a {organization.name}.</p></div></div>
    <div className="team-grid">
      <section className="panel"><h2>Convidar membro</h2>
        <p className="muted">Partilhe a ligação criada com o destinatário. O convite expira em sete dias.</p>
        <ActionForm action={teamAction.bind(null, slug, "invite")} label="Gerar convite">
          <Field label="Email" name="email" type="email" required maxLength={254} />
          <RoleSelect roles={available} label="Papel" />
        </ActionForm>
      </section>
      <section className="panel"><h2>Membros</h2><ul className="record-list">
        {members.data.map((member) => <li key={member.id}>
          <div><strong>{member.profile?.full_name}</strong><span>{member.profile?.email}</span><span>{roleLabels[member.role]}</span></div>
          {member.user_id !== user.id && canManageRole(role, member.role) && <ActionForm action={teamAction.bind(null, slug, "role")} label="Guardar" variant="outline" compact>
            <input type="hidden" name="memberId" value={member.id} />
            <RoleSelect roles={available} current={member.role} label={`Papel de ${member.profile?.full_name ?? "membro"}`} />
          </ActionForm>}
        </li>)}
      </ul></section>
    </div>
    <section className="panel invitations"><h2>Convites pendentes</h2>
      {invitations.data.length === 0 ? <p className="muted">Ainda não existem convites ativos.</p> : <ul className="record-list">
        {invitations.data.map((invite) => <li key={invite.id}><div><strong>{invite.email}</strong>
          <span>{roleLabels[invite.role]} · Até {date.format(new Date(invite.expires_at))}</span></div>
          {canManageRole(role, invite.role) && <ActionForm action={teamAction.bind(null, slug, "revoke")} label="Revogar" variant="outline" compact>
            <input type="hidden" name="invitationId" value={invite.id} />
          </ActionForm>}
        </li>)}
      </ul>}
    </section>
  </WorkShell>;
}
