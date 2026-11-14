"use server";

import { revalidatePath } from "next/cache";
import {
  appointmentSchema, appointmentStatusSchema, barberSchema, customerSchema, hoursSchema, serviceSchema, uuidSchema,
} from "@propulse/shared";
import type { FormState } from "./actions";
import { requireWorkspace } from "./workspace";

export async function operation(slug: string, mode: string, _state: FormState, form: FormData): Promise<FormState> {
  const { organization, client } = await requireWorkspace(slug);
  const organization_id = organization.id;
  const values = Object.fromEntries(form);
  const id = uuidSchema.safeParse(values.id).data;
  if (values.id && !id) return { error: "Identificador inválido." };
  let result: { error: { code: string } | null; data?: unknown };
  switch (mode) {
    case "clientes": {
      const parsed = customerSchema.safeParse(values);
      if (!parsed.success) return { error: "Verifique o nome, o contacto e as notas." };
      const { email, phone, ...fields } = parsed.data;
      const row = { ...fields, email: email || null, phone: phone || null };
      result = id ? await client.from("customers").update(row).eq("organization_id", organization_id).eq("id", id).select("id").single()
        : await client.from("customers").insert({ organization_id, ...row });
      break;
    }
    case "servicos": {
      const parsed = serviceSchema.safeParse(values);
      if (!parsed.success) return { error: "Verifique o nome, a duração e o preço." };
      const { price, ...fields } = parsed.data;
      const row = { ...fields, price_cents: Math.round(Number(price.replace(",", ".")) * 100) };
      result = id ? await client.from("services").update(row).eq("organization_id", organization_id).eq("id", id).select("id").single()
        : await client.from("services").insert({ organization_id, ...row });
      break;
    }
    case "barbeiros": {
      const parsed = barberSchema.safeParse(values);
      if (!parsed.success) return { error: "Verifique o nome do barbeiro." };
      result = id ? await client.from("barbers").update(parsed.data).eq("organization_id", organization_id).eq("id", id).select("id").single()
        : await client.from("barbers").insert({ organization_id, ...parsed.data });
      break;
    }
    case "horarios": {
      if (id) {
        result = await client.from("weekly_hours").delete().eq("organization_id", organization_id).eq("id", id).select("id").single();
      } else {
        const parsed = hoursSchema.safeParse(values);
        if (!parsed.success) return { error: "Verifique o dia e as horas de abertura e fecho." };
        result = await client.from("weekly_hours").insert({
          organization_id, ...parsed.data, barber_id: parsed.data.barber_id || null,
        });
      }
      break;
    }
    case "agenda":
    case "reagendar": {
      if (mode === "reagendar" && !id) return { error: "Marcação inválida." };
      if (id) {
        const status = appointmentStatusSchema.safeParse(values.status);
        if (!status.success) return { error: "Estado inválido." };
        result = await client.rpc("set_appointment_status", { p_org: organization_id, p_id: id, p_status: status.data });
      } else {
        const parsed = appointmentSchema.safeParse(values);
        if (!parsed.success) return { error: "Escolha o cliente, o serviço, o barbeiro e a data." };
        result = await client.rpc("book_appointment", { p_org: organization_id, ...parsed.data, p_existing: mode === "reagendar" ? id : undefined });
      }
      break;
    }
    default: return { error: "Operação indisponível." };
  }
  if (result.error?.code === "23P01") return { error: "O barbeiro já tem uma marcação nesse período." };
  if (result.error?.code === "23505") return { error: "Já existe um registo com estes dados." };
  if (result.error?.code === "22023") return { error: "A data, a disponibilidade ou o estado da marcação já não permite esta operação." };
  if (result.error) return { error: "Não foi possível guardar. Confirme as permissões e os dados." };
  revalidatePath(`/w/${slug}`, "layout");
  return { message: "Alteração guardada." };
}
