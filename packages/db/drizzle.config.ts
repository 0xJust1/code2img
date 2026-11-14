import { defineConfig } from "drizzle-kit";

// Offline generation only (no DB needed): `pnpm --filter @code2img/db generate`
export default defineConfig({
  schema: "./src/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
});
