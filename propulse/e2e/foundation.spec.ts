import { expect, test } from "@playwright/test";

test("página inicial, tema persistido e ligação para acesso", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /A tua próxima oportunidade tem hora/ })).toBeVisible();
  await page.getByRole("button", { name: "Ativar tema claro" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.getByRole("link", { name: "Criar conta", exact: true }).first().click();
  await expect(page.getByRole("heading", { name: /Criar conta|Configuração em falta/ })).toBeVisible();
});

test("uma rota de equipa exige acesso e uma ligação de convite inválida é rejeitada", async ({ page }) => {
  await page.goto("/w/barbearia-teste/equipa");
  await expect(page.getByRole("heading", { name: /Iniciar sessão|Configuração em falta/ })).toBeVisible();
  await page.goto("/join?token=invalido");
  await expect(page.getByRole("heading", { name: "Convite inválido" })).toBeVisible();
});

test("uma ligação real de confirmação Supabase chega à confirmação explícita", async ({ page }) => {
  await page.goto(`/access/confirmar?type=email&token_hash=pkce_${"a".repeat(56)}`);
  await expect(page.getByRole("button", { name: "Confirmar", exact: true })).toBeVisible();
});

test("página inicial em ecrã pequeno não transborda", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/");
  await expect(page.getByRole("link", { name: "Criar conta", exact: true }).first()).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(375);
});
