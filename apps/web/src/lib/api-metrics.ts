// API request metrics: pure helpers + the fire-and-forget writer used by
// apps/web/instrumentation.ts once a response has finished.
//
// Privacy: this module only ever persists the HTTP method, the pathname (query
// string stripped — signed URLs and API tokens travel there), the status code and
// the duration. No header, no IP, no body, no query parameter.
import { getDb, tables, type Database } from "@code2img/db";

/** Minimal shape of the Node request/response the hook hands us (also easy to fake in tests). */
export type RequestLike = { url?: string | undefined; method?: string | undefined };
export type ResponseLike = { statusCode: number };

/** Exact paths that are routes without a trailing slash. `/api` is a real route (app/api/route.ts). */
const EXACT_PATHS = new Set(["/api", "/mcp"]);

/**
 * Pathname only, resolved against a throwaway base: `new URL()` drops the query
 * string while preserving percent-encoding, so `/api/og?title=a%20b` → `/api/og`.
 */
export function pathnameOf(url: string | undefined): string {
  if (!url) return "/";
  try {
    return new URL(url, "http://localhost").pathname;
  } catch {
    return "/";
  }
}

/** Keep the request log to the public API surface: `/api`, `/api/*` and `/mcp` only. */
export function shouldCapture(url: string | undefined): boolean {
  const pathname = pathnameOf(url);
  return EXACT_PATHS.has(pathname) || pathname.startsWith("/api/");
}

/**
 * Persist one finished request. Called from the `finish` listener, i.e. after the
 * response is on the wire: the insert is fire-and-forget and must never throw or
 * surface to the caller — a metrics failure cannot fail a user request.
 */
export function record(
  req: RequestLike,
  res: ResponseLike,
  start: number,
  db: Database | null = getDb(),
): void {
  try {
    if (!db || !shouldCapture(req.url)) return;
    const status = Number.isFinite(res.statusCode) ? Math.trunc(res.statusCode) : 0;
    const row = {
      method: (req.method ?? "GET").slice(0, 8),
      path: pathnameOf(req.url),
      status,
      durationMs: Math.max(0, Math.round(Date.now() - start)),
    };
    // Promise.resolve() normalises Drizzle's thenable into a real promise so the
    // rejection is always caught, even if insert itself throws synchronously.
    void Promise.resolve(db.insert(tables.apiRequests).values(row)).catch((err: unknown) => {
      console.error("[api-metrics]", err);
    });
  } catch (err) {
    console.error("[api-metrics]", err);
  }
}