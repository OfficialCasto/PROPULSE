import { z } from "zod";

const required = (label: string, max: number) =>
  z.string().trim().min(1, `Indique ${label}.`).max(max, `Use até ${max} caracteres.`);

export const emailSchema = z.string().trim().toLowerCase().max(254).pipe(z.email("Introduza um email válido."));
export const passwordSchema = z.string()
  .min(12, "Use pelo menos 12 caracteres.")
  .refine((value) => new TextEncoder().encode(value).length <= 72, "A palavra-passe é demasiado longa.");
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Indique a palavra-passe.").max(256),
});
export const registerSchema = loginSchema.extend({
  fullName: required("o seu nome", 120),
  password: passwordSchema,
});
export const resetSchema = z.object({ email: emailSchema });
export const passwordChangeSchema = z.object({ password: passwordSchema });
export const roles = ["owner", "admin", "manager", "barber", "receptionist"] as const;
export const assignableRoles = ["admin", "manager", "barber", "receptionist"] as const;
export const roleSchema = z.enum(roles);
export type Role = z.infer<typeof roleSchema>;
export const roleLabels: Record<Role, string> = {
  owner: "Proprietário",
  admin: "Administrador",
  manager: "Gerente",
  barber: "Profissional",
  receptionist: "Rececionista",
};
export const uuidSchema = z.uuid();
export const slugSchema = z.string().trim().toLowerCase()
  .min(3, "Use pelo menos 3 caracteres.").max(63)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use letras minúsculas, números e hífen.");
export const organizationSchema = z.object({
  name: required("o nome do negócio", 120),
  slug: slugSchema,
  email: z.union([emailSchema, z.literal("")]),
  phone: z.string().trim().max(32).regex(/^[0-9+(). -]*$/, "Introduza um número válido."),
  address: z.string().trim().max(250),
});
export const invitationSchema = z.object({
  email: emailSchema,
  role: z.enum(assignableRoles),
});
export const memberRoleSchema = z.object({ memberId: uuidSchema, role: z.enum(assignableRoles) });
export const inviteTokenSchema = z.string().regex(/^[0-9a-f]{64}$/);
export type OrganizationInput = z.infer<typeof organizationSchema>;

export function canManageRole(actor: Role, target: Role) {
  return target !== "owner" && (actor === "owner" || (actor === "admin" && target !== "admin"));
}

export function slugFromName(name: string) {
  return name.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-").slice(0, 63).replace(/^-+|-+$/g, "");
}
export * from "./operations.ts";
