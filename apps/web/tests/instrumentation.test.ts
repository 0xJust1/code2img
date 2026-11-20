// Proves the instrumentation hook itself: a real Node HTTP server served through the
// patched `http.Server.prototype.emit`, with the metrics writer mocked so no DB is needed.
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import http from "node:http";
import type { AddressInfo } from "node:net";

const { record } = vi.hoisted(() => ({ record: vi.fn() }));
vi.mock("../src/lib/api-metrics", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../src/lib/api-metrics")>();
  return { ...actual, record };
});

import { register } from "../instrumentation";

const originalEmit = http.Server.prototype.emit;
let server: http.Server;
let base = "";

beforeAll(async () => {
  process.env.NEXT_RUNTIME = "nodejs";
  await register();
  server = http.createServer((req, res) => {
    res.statusCode = req.url?.startsWith("/api/teapot") ? 418 : 200;
    res.end("ok");
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

afterAll(async () => {
  http.Server.prototype.emit = originalEmit;
  delete process.env.NEXT_RUNTIME;
  await new Promise<void>((resolve) => server.close(() => resolve()));
});

describe("instrumentation register()", () => {
  it("is idempotent — a second register() leaves the patch alone", async () => {
    const patched = http.Server.prototype.emit;
    await register();
    expect(http.Server.prototype.emit).toBe(patched);
  });

  it("records a finished /api request and forwards it untouched", async () => {
    const res = await fetch(`${base}/api/v1/themes?token=super-secret`);
    expect(res.status).toBe(200);
    expect(await res.text()).toBe("ok");

    await expect.poll(() => record.mock.calls.length).toBe(1);
    const [req, finished, start] = record.mock.calls[0]!;
    expect(req.url).toBe("/api/v1/themes?token=super-secret"); // record() strips the query
    expect((finished as { statusCode: number }).statusCode).toBe(200);
    expect(typeof start).toBe("number");
  });

  it("records /mcp with the real status code", async () => {
    const res = await fetch(`${base}/api/teapot`);
    expect(res.status).toBe(418);
    await expect.poll(() => record.mock.calls.length).toBe(2);
    expect((record.mock.calls[1]![1] as { statusCode: number }).statusCode).toBe(418);
  });

  it("ignores everything outside the API surface", async () => {
    expect((await fetch(`${base}/pricing`)).status).toBe(200);
    expect((await fetch(`${base}/_next/static/x.js`)).status).toBe(200);
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(record.mock.calls.length).toBe(2);
  });
});