"use client";

import { useActionState, useState } from "react";
import type { ReactNode } from "react";
import { useForm } from "react-hook-form";
import { ArrowRight, Copy } from "lucide-react";
import { slugFromName } from "@propulse/shared";
import { createOrganization, type FormState } from "@/lib/actions";
import { Button, Input } from "./ui";

export function ActionForm({ action, children, label, compact = false, variant = "primary" }: {
  action: (state: FormState, form: FormData) => Promise<FormState>;
  children?: ReactNode; label: string; compact?: boolean; variant?: "primary" | "outline" | "ghost";
}) {
  const [state, dispatch, pending] = useActionState(action, {});
  const [copied, setCopied] = useState<string>();
  return <form action={dispatch} className={compact ? "form compact-form" : "form"}>
    {children}
    <Button type="submit" disabled={pending} variant={variant}>
      {pending ? "A processar…" : label}
      {!compact && !pending && <ArrowRight size={16} aria-hidden="true" />}
    </Button>
    {state.error && <p className="notice error" role="alert">{state.error}</p>}
    {state.message && <p className="notice success" role="status">{state.message}</p>}
    {state.link && <div className="link-copy">
      <Input readOnly value={state.link} aria-label="Ligação do convite" onFocus={(event) => event.currentTarget.select()} />
      <Button type="button" variant="outline" onClick={async () => {
        try { await navigator.clipboard.writeText(state.link!); setCopied(state.link); }
        catch { setCopied(undefined); }
      }}><Copy size={16} aria-hidden="true" />{copied === state.link ? "Copiado" : "Copiar"}</Button>
    </div>}
  </form>;
}

export function Field({ label, name, type = "text", required = false, autoComplete, placeholder, minLength, maxLength }: {
  label: string; name: string; type?: string; required?: boolean; autoComplete?: string; placeholder?: string;
  minLength?: number; maxLength?: number;
}) {
  return <label className="field"><span>{label}</span><Input name={name} type={type} required={required} autoComplete={autoComplete}
    placeholder={placeholder} minLength={minLength} maxLength={maxLength} /></label>;
}

export function OrganizationForm() {
  const { register, setValue, getFieldState } = useForm({ defaultValues: { name: "", slug: "" } });
  const name = register("name");
  return <ActionForm action={createOrganization} label="Criar negócio">
    <label className="field"><span>Nome do negócio</span>
      <Input {...name} required maxLength={120} placeholder="Nome do negócio" onChange={(event) => {
        void name.onChange(event);
        if (!getFieldState("slug").isDirty) setValue("slug", slugFromName(event.target.value));
      }} />
    </label>
    <label className="field"><span>Identificador</span><Input {...register("slug")} required minLength={3} maxLength={63}
      pattern="[a-z0-9]+(?:-[a-z0-9]+)*" autoCapitalize="none" aria-describedby="slug-help" />
      <small id="slug-help">Use letras minúsculas, números e hífen.</small></label>
    <Field label="Email do negócio (opcional)" name="email" type="email" autoComplete="email" maxLength={254} />
    <Field label="Telefone (opcional)" name="phone" type="tel" autoComplete="tel" maxLength={32} />
    <Field label="Morada (opcional)" name="address" autoComplete="street-address" maxLength={250} />
  </ActionForm>;
}
