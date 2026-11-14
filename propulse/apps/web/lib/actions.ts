"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getWorkspace } from "@propulse/database";
import {
  inviteTokenSchema, invitationSchema, loginSchema, memberRoleSchema, organizationSchema,
  passwordChangeSchema, registerSchema, resetSchema, slugSchema, uuidSchema,
} from "@propulse/shared";

import { cookies } from "next/headers";
import { appOrigin, requireUser, supabase } from "./supabase";

export type FormState = { error?: string; message?: string; link?: string };
const invalid = "Verifique os dados e tente novamente.";

function safeNext(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return "/workspaces";
  const match = /^\/join\?token=([0-9a-f]{64})$/.exec(value);
  return match ? value : "/workspaces";
}

export async function authAction(mode: string, _state: FormState, form: FormData): Promise<FormState> {
  const values = Object.fromEntries(form);
  const client = await supabase(true);
  if (mode === "login") {
    const input = loginSchema.safeParse(values);
    if (!input.success) return { error: input.error.issues[0]?.message ?? invalid };
    const { error } = await client.auth.signInWithPassword(input.data);
    if (error) return { error: error.status === 429 ? "Demasiadas tentativas. Tente mais tarde." : "Não foi possível entrar. Verifique as credenciais e a confirmação do email." };
    redirect(safeNext(form.get("next")));
  }
  if (mode === "registo") {
    const input = registerSchema.safeParse(values);
    if (!input.success) return { error: input.error.issues[0]?.message ?? invalid };
    const { email, password, fullName } = input.data;
    const { data, error } = await client.auth.signUp({ email, password, options: {
      emailRedirectTo: appOrigin(), data: { full_name: fullName },
    } });
    if (error) return { error: "Não foi possível criar a conta agora. Tente novamente mais tarde." };
    if (data.session) redirect(safeNext(form.get("next")));
    return { message: "Se o endereço estiver disponível, irá receber uma ligação de confirmação. Se recebeu um convite, volte a abri-lo depois de confirmar a conta." };
  }
  if (mode === "recuperar") {
    const input = resetSchema.safeParse(values);
    if (!input.success) return { error: input.error.issues[0]?.message ?? invalid };
    const { error } = await client.auth.resetPasswordForEmail(input.data.email, { redirectTo: appOrigin() });
    if (error && (error.status ?? 500) >= 500) return { error: "O serviço de recuperação está indisponível. Tente mais tarde." };
    return { message: "Se existir uma conta para esse endereço, receberá uma ligação para repor a palavra-passe." };
  }
  if (mode !== "nova-palavra-passe") return { error: invalid };
  const input = passwordChangeSchema.safeParse(values);
  if (!input.success) return { error: input.error.issues[0]?.message ?? invalid };
  const { client: verifiedClient, user } = await requireUser(true);
  const jar = await cookies();
  if (jar.get("propulse_recovery")?.value !== user.id) return { error: "Abra uma ligação de recuperação válida para continuar." };
  const { error } = await verifiedClient.auth.updateUser({ password: input.data.password });
  if (error) return { error: "Não foi possível alterar a palavra-passe. Utilize uma palavra-passe diferente e tente novamente." };
  jar.delete("propulse_recovery");
  redirect("/workspaces");
}

export async function confirmEmail(_state: FormState, form: FormData): Promise<FormState> {
  const hash = form.get("token_hash");
  const type = form.get("type");
  if (typeof hash !== "string" || !/^(?:pkce_)?[a-f0-9]{56}$/i.test(hash) || (type !== "email" && type !== "recovery")) {
    return { error: "A ligação é inválida ou expirou." };
  }
  const client = await supabase(true);
  const { data, error } = await client.auth.verifyOtp({ token_hash: hash, type });
  if (error || !data.user) return { error: "A ligação é inválida ou expirou." };
  if (type === "recovery") {
    (await cookies()).set("propulse_recovery", data.user.id, {
      httpOnly: true, sameSite: "strict", path: "/", secure: appOrigin().startsWith("https:"), maxAge: 600,
    });
    redirect("/access/nova-palavra-passe");
  }
  redirect("/workspaces");
}

export async function signOut(): Promise<FormState> {
  const client = await supabase(true);
  const { error } = await client.auth.signOut({ scope: "local" });
  if (error) return { error: "Não foi possível terminar a sessão. Tente novamente." };
  (await cookies()).delete("propulse_recovery");
  redirect("/access/login");
}

export async function createOrganization(_state: FormState, form: FormData): Promise<FormState> {
  const { client } = await requireUser(true);
  const input = organizationSchema.safeParse(Object.fromEntries(form));
  if (!input.success) return { error: input.error.issues[0]?.message ?? invalid };
  const { name, slug, email, phone, address } = input.data;
  const { error } = await client.rpc("create_organization", {
    p_name: name, p_slug: slug, p_email: email, p_phone: phone, p_address: address,
  });
  if (error?.code === "23505") return { error: "Este identificador já está em uso. Escolha outro." };
  if (error) return { error: "Não foi possível criar o negócio. Verifique a sua conta e tente novamente." };
  redirect(`/w/${slug}`);
}

export async function teamAction(slug: string, mode: string, _state: FormState, form: FormData): Promise<FormState> {
  const { client, user } = await requireUser(true);
  if (!slugSchema.safeParse(slug).success) return { error: invalid };
  const { data, error } = await getWorkspace(client, user.id, slug);
  if (error) return { error: "Não foi possível verificar as permissões." };
  if (!data?.organization || !["owner", "admin"].includes(data.role)) return { error: "Não tem permissão para gerir esta equipa." };
  const p_org = data.organization.id;
  const path = `/w/${slug}/equipa`;
  const values = Object.fromEntries(form);
  if (mode === "invite") {
    const input = invitationSchema.safeParse(values);
    if (!input.success) return { error: input.error.issues[0]?.message ?? invalid };
    const { data: token, error: err } = await client.rpc("create_invitation", { p_org, p_email: input.data.email, p_role: input.data.role });
    if (err?.code === "23505") return { error: "Já existe uma associação para esse endereço." };
    if (err || !token) return { error: "Não foi possível criar o convite. Verifique o papel selecionado." };
    revalidatePath(path);
    return { message: "Convite criado. Partilhe a ligação com o destinatário.", link: `${appOrigin()}/join?token=${token}` };
  }
  if (mode === "role") {
    const input = memberRoleSchema.safeParse(values);
    if (!input.success) return { error: invalid };
    const { error: err } = await client.rpc("set_member_role", { p_org, p_member: input.data.memberId, p_role: input.data.role });
    if (err) return { error: "Não foi possível alterar o papel. Verifique as permissões." };
    revalidatePath(path);
    return { message: "Papel atualizado." };
  }
  const id = uuidSchema.safeParse(values.invitationId);
  if (mode !== "revoke" || !id.success) return { error: invalid };
  const { error: err } = await client.rpc("revoke_invitation", { p_org, p_invitation: id.data });
  if (err) return { error: "Não foi possível revogar o convite." };
  revalidatePath(path);
  return { message: "Convite revogado." };
}

export async function acceptInvitation(_state: FormState, form: FormData): Promise<FormState> {
  const input = inviteTokenSchema.safeParse(form.get("token"));
  if (!input.success) return { error: "Ligação de convite inválida." };
  const { client } = await requireUser(true, `/join?token=${input.data}`);
  const { data: id, error } = await client.rpc("accept_invitation", { p_token: input.data });
  if (error || !id) return { error: "Não foi possível aceitar o convite. Verifique a ligação e o email da conta." };
  const result = await client.from("organizations").select("slug").eq("id", id).maybeSingle();
  if (result.error) throw result.error;
  redirect(result.data ? `/w/${result.data.slug}` : "/workspaces");
}
