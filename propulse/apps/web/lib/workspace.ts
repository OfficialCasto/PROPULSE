import { notFound } from "next/navigation";
import { getWorkspace } from "@propulse/database";
import { slugSchema } from "@propulse/shared";
import { requireUser } from "./supabase";

export async function requireWorkspace(slug: string) {
  const { client, user } = await requireUser();
  if (!slugSchema.safeParse(slug).success) notFound();
  const { data, error } = await getWorkspace(client, user.id, slug);
  if (error) throw error;
  if (!data?.organization) notFound();
  return { client, user, organization: data.organization, role: data.role };
}
