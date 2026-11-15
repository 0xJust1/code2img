// Idempotency-Key support for POST /api/v1/*. A replay with the same key and the same
// request body returns the first response; the same key with a different body is a 422.
import { createHash, randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { tables, type Database } from "@code2img/db";

const TTL_MS = 24 * 3600 * 1000;

export interface StoredResponse {
  status: number;
  body: Record<string, unknown> | null;
}

export function requestHash(payload: unknown): string {
  return createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

export async function findReplay(
  db: Database,
  userId: string,
  key: string,
  endpoint: string,
  hash: string,
): Promise<{ replay: StoredResponse } | { mismatch: true } | null> {
  const [row] = await db
    .select()
    .from(tables.idempotencyKeys)
    .where(and(eq(tables.idempotencyKeys.userId, userId), eq(tables.idempotencyKeys.key, key)))
    .limit(1);
  if (!row || row.endpoint !== endpoint) return null;
  if (Date.now() - row.createdAt.getTime() > TTL_MS) return null; // stale: treat as new
  if (row.requestHash !== hash) return { mismatch: true };
  return { replay: { status: row.status, body: row.body ?? null } };
}

/** Best effort: an idempotency bookkeeping failure never fails a successful request. */
export async function remember(
  db: Database,
  userId: string,
  key: string,
  endpoint: string,
  hash: string,
  response: StoredResponse,
): Promise<void> {
  await db
    .insert(tables.idempotencyKeys)
    .values({ id: randomUUID(), userId, key, endpoint, requestHash: hash, status: response.status, body: response.body })
    .onConflictDoNothing()
    .catch(() => undefined);
}