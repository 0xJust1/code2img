// Fixed-window rate limiting, counted in Redis when REDIS_URL is set (survives restarts
// and would cover several web instances), in process memory otherwise (dev / tests).
// Redis failures degrade to memory: a limiter outage must not take the API down.

export interface LimitCheck {
  id: string; // e.g. rl:key:<id>:min
  limit: number;
  windowSeconds: number;
}

export interface LimitResult {
  limit: number;
  remaining: number;
  reset: number; // unix seconds when the window ends
  allowed: boolean;
}

const memory = new Map<string, { count: number; reset: number }>();

type RedisMulti = {
  incr(key: string): RedisMulti;
  expire(key: string, seconds: number): RedisMulti;
  exec(): Promise<unknown>;
};

type RedisClient = {
  multi: () => RedisMulti;
  on: (event: string, fn: () => void) => void;
};

let client: RedisClient | null | undefined;

// Native single-host deploy: Redis lives on 127.0.0.1 (redis-server is installed on 1.45).
// Production defaults to it; dev/test stay in memory unless REDIS_URL says otherwise.
function redisUrl(): string | undefined {
  return process.env.REDIS_URL || (process.env.NODE_ENV === "production" ? "redis://127.0.0.1:6379" : undefined);
}

async function redis(): Promise<RedisClient | null> {
  if (client !== undefined) return client;
  const url = redisUrl();
  if (!url) return (client = null);
  try {
    const mod = (await import("ioredis")) as unknown as { default: new (u: string, o?: unknown) => RedisClient };
    const c = new mod.default(url, { maxRetriesPerRequest: 1, enableOfflineQueue: false, lazyConnect: false });
    c.on("error", () => undefined); // keep the process alive; consume() falls back
    client = c;
    return c;
  } catch {
    return (client = null);
  }
}

function memoryCheck(check: LimitCheck, now: number): LimitResult {
  const slot = Math.floor(now / 1000 / check.windowSeconds);
  const key = `${check.id}:${slot}`;
  const reset = (slot + 1) * check.windowSeconds;
  const entry = memory.get(key) ?? { count: 0, reset };
  entry.count += 1;
  memory.set(key, entry);
  // Bound the map: drop entries whose window is over.
  if (memory.size > 5000) for (const [k, v] of memory) if (v.reset < now / 1000) memory.delete(k);
  return { limit: check.limit, remaining: Math.max(0, check.limit - entry.count), reset, allowed: entry.count <= check.limit };
}

async function redisCheck(c: RedisClient, check: LimitCheck, now: number): Promise<LimitResult> {
  const slot = Math.floor(now / 1000 / check.windowSeconds);
  const key = `${check.id}:${slot}`;
  const reset = (slot + 1) * check.windowSeconds;
  const res: unknown = await c.multi().incr(key).expire(key, check.windowSeconds).exec();
  const rows = Array.isArray(res) ? (res as Array<[Error | null, number]>) : [];
  const count = Number(rows[0]?.[1] ?? 0);
  return { limit: check.limit, remaining: Math.max(0, check.limit - count), reset, allowed: count <= check.limit };
}

export async function consume(check: LimitCheck, now: number = Date.now()): Promise<LimitResult> {
  const c = await redis();
  if (c) {
    try {
      return await redisCheck(c, check, now);
    } catch {
      // fall through to memory
    }
  }
  return memoryCheck(check, now);
}

/** Applies every check; the tightest result wins (headers describe the exhausted one). */
export async function consumeAll(checks: LimitCheck[], now: number = Date.now()): Promise<LimitResult> {
  const results = await Promise.all(checks.map((c) => consume(c, now)));
  const allowed = results.every((r) => r.allowed);
  const tightest = results.reduce((a, b) => (b.remaining / b.limit < a.remaining / a.limit ? b : a));
  return { ...tightest, allowed };
}

export function limitHeaders(r: LimitResult): Record<string, string> {
  return {
    "x-ratelimit-limit": String(r.limit),
    "x-ratelimit-remaining": String(r.remaining),
    "x-ratelimit-reset": String(r.reset),
    ...(r.allowed ? {} : { "retry-after": String(Math.max(1, r.reset - Math.floor(Date.now() / 1000))) }),
  };
}

/** Test hook: forget the in-process counters. */
export function resetRateLimits(): void {
  memory.clear();
}