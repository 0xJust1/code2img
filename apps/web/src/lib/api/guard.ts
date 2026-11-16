// The single trust boundary of /api/v1: API-key auth, scopes, rate limits, usage
// accounting. Routes stay thin: `const g = await guard(req, {scope:"write"}); if (!g.ok) return g.response;`
import { apiLimits, type Plan } from "@code2img/shared";
import { getDb, tables, type Database } from "@code2img/db";
import { and, eq, sql } from "drizzle-orm";
import { hasScope, keyFromRaw, rawKeyFrom, type ApiKeyRow, type Scope } from "./keys";
import { consumeAll, limitHeaders, type LimitResult } from "./ratelimit";
import { problem, problemWithHeaders } from "./problem";
import { planOf, type User } from "../session";

// Anonymous traffic (catalog endpoints, image GET) is allowed, but never unbounded.
const IP_LIMITS = { perMinute: 120, perDay: 2000 };

export interface ApiContext {
  db: Database;
  user: User;
  key: ApiKeyRow;
  plan: Plan;
  headers: Record<string, string>;
}

export type ApiGuard = { ok: true; ctx: ApiContext } | { ok: false; response: Response };

export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  return fwd?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "local";
}

function ipChecks(ip: string) {
  return [
    { id: `rl:ip:${ip}:min`, limit: IP_LIMITS.perMinute, windowSeconds: 60 },
    { id: `rl:ip:${ip}:day`, limit: IP_LIMITS.perDay, windowSeconds: 86400 },
  ];
}

function tooMany(r: LimitResult): Response {
  return problemWithHeaders(429, "Rate limit exceeded", `Retry in ${Math.max(1, r.reset - Math.floor(Date.now() / 1000))}s.`, limitHeaders(r), {
    limit: r.limit,
    remaining: r.remaining,
    reset: r.reset,
  });
}

/** Authenticated API request: key + scope + quota + usage counter. */
export async function guard(req: Request, opts: { scope?: Scope } = {}): Promise<ApiGuard> {
  const raw = rawKeyFrom(req.headers);
  if (!raw) {
    const res = problem(401, "Unauthorized", "Send an API key: Authorization: Bearer ***");
    res.headers.set("www-authenticate", 'Bearer realm="code2img"');
    return { ok: false, response: res };
  }

  const db = getDb();
  if (!db) return { ok: false, response: problem(503, "Service unavailable", "Database is not configured.") };

  const key = await keyFromRaw(db, raw);
  if (!key) return { ok: false, response: problem(401, "Invalid API key", "The key is unknown or has been revoked.") };
  if (opts.scope && !hasScope(key, opts.scope)) {
    return { ok: false, response: problem(403, "Insufficient scope", `This key needs the "${opts.scope}" scope.`) };
  }

  const [user] = await db.select().from(tables.users).where(eq(tables.users.id, key.userId)).limit(1);
  if (!user) return { ok: false, response: problem(401, "Invalid API key", "The key owner no longer exists.") };
  const plan = planOf(user);
  const limits = apiLimits(plan);
  const ip = clientIp(req);

  const r = await consumeAll([
    { id: `rl:key:${key.id}:min`, limit: limits.perMinute, windowSeconds: 60 },
    { id: `rl:key:${key.id}:day`, limit: limits.perDay, windowSeconds: 86400 },
    ...ipChecks(ip),
  ]);
  if (!r.allowed) return { ok: false, response: tooMany(r) };

  await bumpUsage(db, user.id, "apiCalls");
  return { ok: true, ctx: { db, user, key, plan, headers: limitHeaders(r) } };
}

/** Anonymous API request: IP quota only (catalog lists, public image reads). */
export async function publicGuard(req: Request): Promise<{ ok: true; headers: Record<string, string> } | { ok: false; response: Response }> {
  const r = await consumeAll(ipChecks(clientIp(req)));
  if (!r.allowed) return { ok: false, response: tooMany(r) };
  return { ok: true, headers: limitHeaders(r) };
}

/** usage_counter upsert: one row per user per UTC day. */
export async function bumpUsage(db: Database, userId: string, field: "apiCalls" | "renders"): Promise<void> {
  const day = new Date().toISOString().slice(0, 10);
  const col = field === "apiCalls" ? tables.usageCounters.apiCalls : tables.usageCounters.renders;
  const insert = field === "apiCalls" ? { apiCalls: 1 } : { renders: 1 };
  await db
    .insert(tables.usageCounters)
    .values({ userId, day, ...insert })
    .onConflictDoUpdate({
      target: [tables.usageCounters.userId, tables.usageCounters.day],
      set: { [field]: sql`${col} + 1` },
    })
    .catch(() => undefined); // accounting must never fail a render
}

export async function readUsage(db: Database, userId: string) {
  const day = new Date().toISOString().slice(0, 10);
  const [row] = await db
    .select()
    .from(tables.usageCounters)
    .where(and(eq(tables.usageCounters.userId, userId), eq(tables.usageCounters.day, day)))
    .limit(1);
  return { day, apiCalls: row?.apiCalls ?? 0, renders: row?.renders ?? 0 };
}