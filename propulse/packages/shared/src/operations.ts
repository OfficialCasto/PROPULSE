import { z } from "zod";

const name = z.string().trim().min(1).max(120);
const flag = z.enum(["true", "false"]).transform((value) => value === "true");
export const customerSchema = z.object({
  name, email: z.union([z.email().max(254), z.literal("")]).transform((value) => value.toLowerCase()),
  phone: z.string().trim().max(32).regex(/^[0-9+(). -]*$/),
  notes: z.string().trim().max(2000),
  archived: flag,
});
export const barberSchema = z.object({ name, active: flag });
export const serviceSchema = barberSchema.extend({
  duration_minutes: z.coerce.number().int().min(5).max(480),
  price: z.string().trim().regex(/^\d{1,5}(?:[.,]\d{1,2})?$/),
});
const clock = z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/);
export const hoursSchema = z.object({
  barber_id: z.union([z.uuid(), z.literal("")]),
  weekday: z.coerce.number().int().min(1).max(7),
  opens_at: clock,
  closes_at: clock,
}).refine((value) => value.opens_at < value.closes_at);
export const appointmentStatusSchema = z.enum(["pending", "confirmed", "completed", "cancelled", "no_show"]);
export const appointmentSchema = z.object({
  p_customer: z.uuid(), p_service: z.uuid(), p_barber: z.uuid(),
  p_start: z.iso.datetime({ local: true }).refine((value) => !value.endsWith("Z")),
});
export const appointmentLabels = {
  pending: "Pendente", confirmed: "Confirmada", completed: "Concluída", cancelled: "Cancelada", no_show: "Falta",
};
