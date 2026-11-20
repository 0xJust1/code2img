// Request-metrics tests: the capture filter, the query-free pathname, and the
// fire-and-forget writer against both a real embedded Postgres and a failing client.
import { afterEach, describe, expect, it, vi } from "vitest";
import { createTestDb, tables, type Database } from "@code2img/db";
import { pathnameOf, record, shouldCapture } from "../src/lib/api-metrics";

const db = (await createTestDb()) as unknown as Database;

afterEach(() => {
  vi.restoreAllMocks();
});

describe("shouldCapture", () => {
  it("captures the API surface and nothing else", () => {
    expect(shouldCapture("/api/v1/themes")).toBe(true);
    expect(shouldCapture("/api/og?title=x")).toBe(true);
    expect(shouldCapture("/mcp")).toBe(true);
    expect(shouldCapture("/")).toBe(false);
    expect(shouldCapture("/_next/static/x.js")).toBe(false);
    expect(shouldCapture("/pricing")).toBe(false);
    expect(shouldCapture("/favicon.ico")).toBe(false);
  });

  it("captures bare /api — it is a real route (app/api/route.ts)", () => {
    expect(shouldCapture("/api")).toBe(true);
    expect(shouldCapture("/api/")).toBe(true);
  });

  it("is case-sensitive and refuses look-alike prefixes", () => {
    expect(shouldCapture("/apix")).toBe(false);
    expect(shouldCapture("/apiary")).toBe(false);
    expect(shouldCapture("/MCP")).toBe(false);
    expect(shouldCapture("/mcp/")).toBe(false); // the router 308s it to /mcp, which is captured
    expect(shouldCapture(undefined)).toBe(false);
  });

  it("works on absolute URLs too", () => {
    expect(shouldCapture("https://code2img.app/api/me?x=1")).toBe(true);
  });
});

describe("pathnameOf", () => {
  it("strips the query string (signed URL) and keeps the path", () => {
    expect(pathnameOf("/api/v1/render.png?code=a%20b&sig=secret")).toBe("/api/v1/render.png");
    expect(pathnameOf("/api/og?title=x")).toBe("/api/og");
    expect(pathnameOf("https://code2img.app/mcp?key=abc")).toBe("/mcp");
  });

  it("preserves percent-encoding and whitespace-free paths", () => {
    expect(pathnameOf("/i/caf%C3%A9?utm=1")).toBe("/i/caf%C3%A9");
    expect(pathnameOf("/api/v1/themes")).toBe("/api/v1/themes");
  });

  it("falls back to / for an empty url", () => {
    expect(pathnameOf(undefined)).toBe("/");
    expect(pathnameOf("")).toBe("/");
  });
});

describe("record", () => {
  it("persists method, query-free path, status and duration", async () => {
    const start = Date.now() - 42;
    record({ url: "/api/v1/themes?token=super-secret", method: "POST" }, { statusCode: 201 }, start, db);

    await expect
      .poll(async () => (await db.select().from(tables.apiRequests)).length, { timeout: 5000, interval: 25 })
      .toBe(1);

    const [row] = await db.select().from(tables.apiRequests);
    expect(row!.method).toBe("POST");
    expect(row!.path).toBe("/api/v1/themes");
    expect(row!.path).not.toContain("super-secret");
    expect(row!.status).toBe(201);
    expect(row!.durationMs).toBeGreaterThanOrEqual(42);
    expect(row!.ts).toBeInstanceOf(Date);
  });

  it("skips non-API requests without touching the database", () => {
    let inserts = 0;
    const spy = {
      insert: () => {
        inserts += 1;
        return { values: () => Promise.resolve() };
      },
    } as unknown as Database;
    record({ url: "/pricing", method: "GET" }, { statusCode: 200 }, Date.now(), spy);
    expect(inserts).toBe(0);
  });

  it("never throws nor leaves a rejection unhandled when the insert rejects", async () => {
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    const failing = {
      insert: () => ({ values: () => Promise.reject(new Error("db down")) }),
    } as unknown as Database;

    expect(() => record({ url: "/api/v1/render", method: "POST" }, { statusCode: 500 }, Date.now(), failing)).not.toThrow();
    await new Promise((resolve) => setImmediate(resolve));
    expect(errors).toHaveBeenCalledWith("[api-metrics]", expect.any(Error));
  });

  it("never throws when the insert throws synchronously", () => {
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    const throwing = {
      insert: () => {
        throw new Error("client closed");
      },
    } as unknown as Database;

    expect(() => record({ url: "/api/me", method: "GET" }, { statusCode: 200 }, Date.now(), throwing)).not.toThrow();
    expect(errors).toHaveBeenCalledWith("[api-metrics]", expect.any(Error));
  });

  it("is a no-op without a database client", () => {
    expect(() => record({ url: "/api/me", method: "GET" }, { statusCode: 200 }, Date.now(), null)).not.toThrow();
  });
});