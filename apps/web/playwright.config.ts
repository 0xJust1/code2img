import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  retries: 0,
  use: { baseURL: "http://localhost:3000" },
  webServer: [
    {
      command: "pnpm --filter @code2img/render dev",
      cwd: "../..",
      url: "http://localhost:3002/healthz",
      reuseExistingServer: true,
      timeout: 60_000,
    },
    {
      command: "pnpm dev",
      url: "http://localhost:3000",
      reuseExistingServer: true,
      timeout: 90_000,
    },
  ],
});
