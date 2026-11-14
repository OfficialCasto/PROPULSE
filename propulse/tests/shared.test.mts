import assert from "node:assert/strict";
import { test } from "node:test";
import {
  canManageRole, invitationSchema, organizationSchema, passwordSchema, slugFromName,
} from "../packages/shared/src/index.ts";

test("normaliza nomes portugueses e valida o identificador", () => {
  assert.equal(slugFromName("  João & Irmãos — Lisboa "), "joao-irmaos-lisboa");
  assert.equal(organizationSchema.safeParse({ name: "João", slug: "a--b", email: "", phone: "", address: "" }).success, false);
  assert.equal(organizationSchema.safeParse({
    name: "João", slug: "joao';select-1;--", email: "", phone: "", address: "",
  }).success, false);
  assert.deepEqual(organizationSchema.parse({
    name: " João ", slug: " JOAO-LISBOA ", email: " DONO@EXAMPLE.COM ", phone: " +351 910 000 000 ", address: "",
  }), { name: "João", slug: "joao-lisboa", email: "dono@example.com", phone: "+351 910 000 000", address: "" });
});

test("limita palavras-passe pelo comprimento em bytes", () => {
  assert.equal(passwordSchema.safeParse("Curta-123").success, false);
  assert.equal(passwordSchema.safeParse("ç".repeat(36)).success, true);
  assert.equal(passwordSchema.safeParse("ç".repeat(37)).success, false);
});

test("protege a atribuição de proprietário e administrador", () => {
  assert.equal(canManageRole("owner", "admin"), true);
  assert.equal(canManageRole("admin", "manager"), true);
  assert.equal(canManageRole("admin", "admin"), false);
  assert.equal(canManageRole("barber", "receptionist"), false);
  assert.equal(canManageRole("owner", "owner"), false);
  assert.equal(invitationSchema.safeParse({ email: "demo@example.com", role: "owner" }).success, false);
});
