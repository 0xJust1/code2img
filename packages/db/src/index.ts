import { createProdDb, runMigrations, createTestDb } from "./migrate";
import * as schema from "./schema";

export type Database = ReturnType<typeof createProdDb>;
export * as tables from "./schema";
export { schema };
export * from "./schema";
export { createProdDb, runMigrations, createTestDb };

let cached: Database | null = null;

// Lazy singleton: without DATABASE_URL the web app still runs in Phase 1 mode
// (auth/billing routes return 503) — the DB must be provisioned to enable them.
export function getDb(): Database | null {
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  cached ??= createProdDb(url);
  return cached;
}
