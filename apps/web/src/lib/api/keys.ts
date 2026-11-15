// API keys: readable prefix + hashed secret. The plaintext is shown once, at creation;
// only sha256(raw) is stored, so a DB dump cannot be replayed against the API.
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { and, desc, eq, isNull } from "drizzle-orm";
import { tables, type Database } from "@code2img/db";

export type Scope = "read" | "write" | "upload";
export const ALL_SCOPES: Scope[] = ["read", "write", "upload"];

export type ApiKeyRow = typeof tables.apiKeys.$inferSelect;

export function hashApiKey(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

export function generateApiKey(): { raw: string; prefix: string; hash: string } {
  const prefix = `c2i_live_${randomBytes(4).toString("hex")}`;
  const raw = `${prefix}_${randomBytes(24).toString("base64url")}`;
  return { raw, prefix, hash: hashApiKey(raw) };
}

export function cleanScopes(input: unknown): Scope[] {
  if (!Array.isArray(input)) return [...ALL_SCOPES];
  const picked = input.filter((s): s is Scope => ALL_SCOPES.includes(s as Scope));
  return picked.length ? [...new Set(picked)] : [...ALL_SCOPES];
}

export function hasScope(row: { scopes: string[] }, scope: Scope): boolean {
  return row.scopes.includes(scope);
}

/** Returns the plaintext key exactly once; the caller shows it and forgets it. */
export async function createApiKey(
  db: Database,
  userId: string,
  scopes: unknown,
): Promise<{ id: string; prefix: string; raw: string; scopes: string[] }> {
  const { raw, prefix, hash } = generateApiKey();
  const id = randomUUID();
  const cleaned = cleanScopes(scopes);
  await db.insert(tables.apiKeys).values({ id, userId, prefix, keyHash: hash, scopes: cleaned });
  return { id, prefix, raw, scopes: cleaned };
}

/** Bearer / x-api-key extraction. */
export function rawKeyFrom(headers: Headers): string | null {
  const auth = headers.get("authorization");
  if (auth?.startsWith("Bearer ")) return auth.slice(7).trim() || null;
  return headers.get("x-api-key")?.trim() || null;
}

/** Active (non-revoked) key row for a plaintext key, or null. Touches last_used_at. */
export async function keyFromRaw(db: Database, raw: string): Promise<ApiKeyRow | null> {
  if (!raw.startsWith("c2i_live_")) return null;
  const [row] = await db
    .select()
    .from(tables.apiKeys)
    .where(and(eq(tables.apiKeys.keyHash, hashApiKey(raw)), isNull(tables.apiKeys.revokedAt)))
    .limit(1);
  if (!row) return null;
  // Fire and forget: a failed touch must not fail the request.
  db.update(tables.apiKeys)
    .set({ lastUsedAt: new Date() })
    .where(eq(tables.apiKeys.id, row.id))
    .catch(() => undefined);
  return row;
}

export async function listApiKeys(db: Database, userId: string) {
  const rows = await db
    .select({
      id: tables.apiKeys.id,
      prefix: tables.apiKeys.prefix,
      scopes: tables.apiKeys.scopes,
      lastUsedAt: tables.apiKeys.lastUsedAt,
      revokedAt: tables.apiKeys.revokedAt,
      createdAt: tables.apiKeys.createdAt,
    })
    .from(tables.apiKeys)
    .where(eq(tables.apiKeys.userId, userId))
    .orderBy(desc(tables.apiKeys.createdAt));
  return rows;
}

export async function revokeApiKey(db: Database, userId: string, id: string): Promise<boolean> {
  const res = await db
    .update(tables.apiKeys)
    .set({ revokedAt: new Date() })
    .where(and(eq(tables.apiKeys.id, id), eq(tables.apiKeys.userId, userId), isNull(tables.apiKeys.revokedAt)))
    .returning({ id: tables.apiKeys.id });
  return res.length > 0;
}

/** Rotation = new key with the same scopes, old one revoked immediately. */
export async function rotateApiKey(db: Database, userId: string, id: string): Promise<{ id: string; prefix: string; raw: string; scopes: string[] } | null> {
  const [row] = await db
    .select()
    .from(tables.apiKeys)
    .where(and(eq(tables.apiKeys.id, id), eq(tables.apiKeys.userId, userId)))
    .limit(1);
  if (!row || row.revokedAt) return null;
  await db.update(tables.apiKeys).set({ revokedAt: new Date() }).where(eq(tables.apiKeys.id, id));
  return createApiKey(db, userId, row.scopes);
}