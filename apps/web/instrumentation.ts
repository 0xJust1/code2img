// Next.js instrumentation hook — node runtime only.
//
// Every request served by the web app goes through Node's `http.Server`, so a single
// patch of `Server.prototype.emit` lets us time each one and persist the API calls
// (/api, /api/*, /mcp) once the response has finished. Everything else is ignored.
// The patch is idempotent (globalThis flag), forwards every other event untouched and
// must never throw: metrics can never break a page or an API response.
import type { IncomingMessage, Server, ServerResponse } from "node:http";

type MetricsGlobal = typeof globalThis & { __code2imgApiMetricsPatched?: boolean };

export async function register(): Promise<void> {
  // postgres-js cannot run on the edge runtime; skip it entirely.
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const g = globalThis as MetricsGlobal;
  if (g.__code2imgApiMetricsPatched) return;
  g.__code2imgApiMetricsPatched = true;

  try {
    const http = await import("node:http");
    const { record, shouldCapture } = await import("./src/lib/api-metrics");
    const originalEmit = http.Server.prototype.emit;

    http.Server.prototype.emit = function patchedEmit(
      this: Server,
      event: string | symbol,
      ...args: unknown[]
    ): boolean {
      if (event === "request") {
        try {
          const req = args[0] as IncomingMessage;
          const res = args[1] as ServerResponse;
          // Cheap early filter: only the API surface gets a finish listener.
          if (shouldCapture(req.url)) {
            const start = Date.now();
            // `finish` = the response is fully flushed; recording adds zero latency.
            res.once("finish", () => record(req, res, start));
          }
        } catch (err) {
          console.error("[api-metrics]", err);
        }
      }
      return Reflect.apply(originalEmit, this, [event, ...args]) as boolean;
    };
  } catch (err) {
    // Leave the flag unset so a later register() call could retry.
    g.__code2imgApiMetricsPatched = false;
    console.error("[api-metrics] instrumentation disabled", err);
  }
}