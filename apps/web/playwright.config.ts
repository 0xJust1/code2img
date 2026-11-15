import path from "node:path";
import { defineConfig } from "@playwright/test";

// The public-page specs need a real Postgres and a writable share storage dir;
// without E2E_DATABASE_URL they skip (the editor spec never touches the DB).
// Both the web server and the specs run with apps/web as cwd: one shared path.
const shareDir = process.env.E2E_SHARE_IMAGES_DIR ?? path.resolve(process.cwd(), ".e2e-data/share");
const webEnv = {
  ...process.env,
  APP_URL: process.env.E2E_APP_URL ?? "http://localhost:3000",
  SHARE_IMAGES_DIR: shareDir,
  ...(process.env.E2E_DATABASE_URL ? { DATABASE_URL: process.env.E2E_DATABASE_URL } : {}),
};

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
      env: webEnv,
    },
  ],
});