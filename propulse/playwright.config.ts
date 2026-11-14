import { defineConfig } from "@playwright/test";

const baseURL = process.env.PROPULSE_E2E_URL ?? "http://127.0.0.1:3000";
export default defineConfig({
  testDir: "./e2e",
  timeout: 90000,
  expect: { timeout: 15000 },
  use: {
    baseURL,
    launchOptions: { executablePath: process.env.PROPULSE_BROWSER },
  },
  webServer: process.env.PROPULSE_E2E_URL ? undefined : {
    command: "pnpm --filter @propulse/web exec next start --hostname 127.0.0.1",
    url: baseURL,
    reuseExistingServer: false,
  },
});
