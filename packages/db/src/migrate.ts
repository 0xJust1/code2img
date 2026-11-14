import { readFile } from "node:fs/promises";
import path from "node:path";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Applies the generated SQL migrations (drizzle/*.sql) in filename order.
// PGlite (embedded Postgres) is used for tests; postgres-js for the real DB.
type Sql = { query: (q: string) => Promise<unknown> };

export async function runMigrations(client: Sql): Promise<void> {
  const dir = path.resolve(import.meta.dirname ?? ".", "..", "drizzle");
  const { readdir, } = await import("node:fs/promises");
  const files = (await readdir(dir)).filter((f) => f.endsWith(".sql")).sort();
  for (const file of files) {
    const sql = await readFile(path.join(dir, file), "utf8");
    // Drizzle separates statements with "--> statement-breakpoint" markers.
    // PGlite's exec() handles multi-command scripts; plain clients get one query per split.
    const c = client as Sql & { exec?: (q: string) => Promise<unknown> };
    if (typeof c.exec === "function") {
      await c.exec(sql.replace(/-->\s*statement-breakpoint/g, ";"));
    } else {
      for (const stmt of sql.split(/-->\s*statement-breakpoint/g)) {
        const trimmed = stmt.trim();
        if (trimmed) await client.query(trimmed.endsWith(";") ? trimmed : `${trimmed};`);
      }
    }
  }
}

/** Test helper: fresh embedded Postgres with migrations applied. */
export async function createTestDb() {
  const client = new PGlite();
  await runMigrations(client);
  return drizzlePglite(client, { schema });
}

/** Production database (used by apps via getDb()). */
export function createProdDb(url: string) {
  const client = postgres(url, { max: 5 });
  return drizzle(client, { schema });
}

export * from "./schema";
