// Phase 4 tests: API keys, quotas, RFC 9457 errors, idempotency, signed URLs,
// stored images, usage counters — plus a contract check between the published
// OpenAPI document, the SDK and the actual route files.
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { existsSync, readdirSync } from "node:fs";
import { mkdtemp } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { eq } from "drizzle-orm";
import { createTestDb, tables, type Database } from "@code2img/db";
import { openapiDocument, THEMES, FONTS, LANGUAGES } from "@code2img/shared";
import { PATHS } from "@code2img/sdk";
import {
  ALL_SCOPES,
  cleanScopes,
  createApiKey,
  generateApiKey,
  hashApiKey,
  hasScope,
  keyFromRaw,
  listApiKeys,
  rawKeyFrom,
  revokeApiKey,
  rotateApiKey,
} from "../src/lib/api/keys";
import { consume, consumeAll, limitHeaders, resetRateLimits } from "../src/lib/api/ratelimit";
import { problem } from "../src/lib/api/problem";
import { sign, verify, canonical, signableString } from "../src/lib/api/sign";
import { findReplay, remember, requestHash } from "../src/lib/api/idempotency";
import { deleteImage, readImage, saveImage } from "../src/lib/api/images";
import { bumpUsage, readUsage } from "../src/lib/api/guard";

delete process.env.REDIS_URL; // force the in-process limiter
process.env.SHARE_IMAGES_DIR = await mkdtemp(path.join(os.tmpdir(), "c2i-api-"));
process.env.APP_URL = "https://code2img.app";

const db = (await createTestDb()) as unknown as Database;
const USER = "u_api_owner";
const OTHER = "u_api_other";
const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3]);

beforeAll(async () => {
  await db.insert(tables.users).values([
    { id: USER, email: "api@example.com", name: "Api" },
    { id: OTHER, email: "api-other@example.com", name: "Other" },
  ]);
});

beforeEach(() => resetRateLimits());

describe("api keys", () => {
  it("store only a hash, with a readable prefix", async () => {
    const created = await createApiKey(db, USER, ["read"]);
    expect(created.raw).toMatch(/^c2i_live_[0-9a-f]{8}_[\w-]{20,}$/);
    expect(created.prefix).toBe(created.raw.slice(0, created.raw.indexOf("_", 9)));
    const [row] = await db.select().from(tables.apiKeys).where(eq(tables.apiKeys.id, created.id));
    expect(row!.keyHash).toBe(hashApiKey(created.raw));
    expect(row!.keyHash).not.toContain(created.raw);
    expect(row!.scopes).toEqual(["read"]);
  });

  it("authenticates an active key and refuses revoked ones", async () => {
    const created = await createApiKey(db, USER, ["read"]);
    expect((await keyFromRaw(db, created.raw))?.id).toBe(created.id);
    expect(await keyFromRaw(db, "c2i_live_deadbeef_nope")).toBeNull();
    expect(await keyFromRaw(db, created.raw.slice(0, -1))).toBeNull();
    expect(await revokeApiKey(db, USER, created.id)).toBe(true);
    expect(await keyFromRaw(db, created.raw)).toBeNull();
    expect(await revokeApiKey(db, USER, created.id)).toBe(false); // already revoked
  });

  it("never lets another user revoke or rotate a key", async () => {
    const created = await createApiKey(db, USER, ALL_SCOPES);
    expect(await revokeApiKey(db, OTHER, created.id)).toBe(false);
    expect(await rotateApiKey(db, OTHER, created.id)).toBeNull();
    expect(await keyFromRaw(db, created.raw)).not.toBeNull();
  });

  it("rotates: old key dies, new key keeps the scopes", async () => {
    const created = await createApiKey(db, USER, ["upload"]);
    const rotated = await rotateApiKey(db, USER, created.id);
    expect(rotated?.scopes).toEqual(["upload"]);
    expect(await keyFromRaw(db, created.raw)).toBeNull();
    expect((await keyFromRaw(db, rotated!.raw))?.id).toBe(rotated!.id);
  });

  it("parses bearer and x-api-key, checks scopes", () => {
    expect(rawKeyFrom(new Headers({ authorization: "Bearer abc" }))).toBe("abc");
    expect(rawKeyFrom(new Headers({ "x-api-key": "abc" }))).toBe("abc");
    expect(rawKeyFrom(new Headers())).toBeNull();
    expect(hasScope({ scopes: ["read"] }, "read")).toBe(true);
    expect(hasScope({ scopes: ["read"] }, "write")).toBe(false);
    expect(cleanScopes(["bogus", "read", "read"])).toEqual(["read"]);
    expect(cleanScopes([])).toEqual(ALL_SCOPES);
    expect(generateApiKey().raw).toMatch(/^c2i_live_/);
  });

  it("lists keys newest first, without the hash", async () => {
    const created = await createApiKey(db, USER, ["read"]);
    const keys = await listApiKeys(db, USER);
    expect(keys[0]!.id).toBe(created.id);
    expect(Object.keys(keys[0]!)).not.toContain("keyHash");
  });
});

describe("rate limiting", () => {
  it("blocks after the window budget and reports headers", async () => {
    const check = { id: "rl:test:min", limit: 2, windowSeconds: 60 };
    const now = Date.UTC(2026, 0, 1, 12, 0, 5);
    expect((await consume(check, now)).allowed).toBe(true);
    expect((await consume(check, now)).allowed).toBe(true);
    const blocked = await consume(check, now);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.reset).toBe(Math.ceil(now / 60000) * 60);
    const headers = limitHeaders(blocked);
    expect(headers["x-ratelimit-limit"]).toBe("2");
    expect(headers["retry-after"]).toBeDefined();
    // A new window starts fresh.
    expect((await consume(check, now + 60_000)).allowed).toBe(true);
  });

  it("consumeAll fails when any check is exhausted", async () => {
    const now = Date.UTC(2026, 0, 1, 12, 0, 5);
    await consume({ id: "rl:a", limit: 1, windowSeconds: 60 }, now);
    const r = await consumeAll(
      [
        { id: "rl:a", limit: 1, windowSeconds: 60 },
        { id: "rl:b", limit: 100, windowSeconds: 60 },
      ],
      now,
    );
    expect(r.allowed).toBe(false);
    expect(r.limit).toBe(1);
  });
});

describe("problem details (RFC 9457)", () => {
  it("emits application/problem+json with type, title, status", async () => {
    const res = problem(429, "Rate limit exceeded", "Retry in 3s.", { limit: 30 });
    expect(res.status).toBe(429);
    expect(res.headers.get("content-type")).toBe("application/problem+json");
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.type).toBe("https://code2img.app/problems/rate-limit-exceeded");
    expect(body.title).toBe("Rate limit exceeded");
    expect(body.status).toBe(429);
    expect(body.detail).toBe("Retry in 3s.");
    expect(body.limit).toBe(30);
  });
});

describe("signed render URLs", () => {
  const secret = "test-secret";
  const params = { code: "console.log(1)", lang: "javascript", theme: "dracula" };

  it("round-trips and refuses tampering", () => {
    const sig = sign(params, secret);
    expect(verify(params, sig, secret)).toBe(true);
    expect(verify({ ...params, code: "process.exit(1)" }, sig, secret)).toBe(false);
    expect(verify(params, sig, "other-secret")).toBe(false);
    expect(verify(params, "", secret)).toBe(false);
    expect(verify(params, sig, undefined)).toBe(false);
  });

  it("signs only allowlisted params, in a stable order", () => {
    const a = signableString({ theme: "dracula", code: "x", lang: "go" });
    const b = signableString({ lang: "go", code: "x", theme: "dracula" });
    expect(a).toBe(b);
    expect(canonical({ code: "x", junk: "y" } as never)).toEqual({ code: "x" });
  });
});

describe("idempotency", () => {
  it("replays a stored response, flags a body mismatch, ignores stale keys", async () => {
    const key = "idem-1";
    const endpoint = "POST /v1/images";
    const hash = requestHash({ code: "a" });
    expect(await findReplay(db, USER, key, endpoint, hash)).toBeNull();
    await remember(db, USER, key, endpoint, hash, { status: 200, body: { imageId: "img-1" } });
    const replay = await findReplay(db, USER, key, endpoint, hash);
    expect(replay && "replay" in replay && replay.replay.body).toEqual({ imageId: "img-1" });
    const mismatch = await findReplay(db, USER, key, endpoint, requestHash({ code: "b" }));
    expect(mismatch && "mismatch" in mismatch).toBe(true);
    // Another account's key of the same name is independent.
    expect(await findReplay(db, OTHER, key, endpoint, hash)).toBeNull();
  });
});

describe("stored api images", () => {
  it("stores bytes, reads them back and enforces ownership on delete", async () => {
    const saved = await saveImage(db, { userId: USER, bytes: PNG, format: "png", config: { code: "secret", theme: "dracula" } });
    const img = await readImage(db, saved.id);
    expect(img?.mime).toBe("image/png");
    expect(new Uint8Array(img!.buf)).toEqual(PNG);

    // The row keeps a config hash but no code.
    const [row] = await db.select().from(tables.images).where(eq(tables.images.id, saved.id));
    expect(row!.config).toBeNull();
    expect(JSON.stringify(row)).not.toContain("secret");

    expect(await deleteImage(db, OTHER, saved.id)).toBe(false);
    expect(await deleteImage(db, USER, saved.id)).toBe(true);
    expect(await readImage(db, saved.id)).toBeNull();
    expect(await deleteImage(db, USER, "../../etc/passwd")).toBe(false);
  });

  it("refuses expired images", async () => {
    const saved = await saveImage(db, { userId: USER, bytes: PNG, format: "png", config: {} });
    await db.update(tables.images).set({ expiresAt: new Date(Date.now() - 1000) }).where(eq(tables.images.id, saved.id));
    expect(await readImage(db, saved.id)).toBeNull();
  });
});

describe("usage counters", () => {
  it("increments once per call and reads today's row", async () => {
    const before = await readUsage(db, USER);
    await bumpUsage(db, USER, "apiCalls");
    await bumpUsage(db, USER, "apiCalls");
    await bumpUsage(db, USER, "renders");
    const after = await readUsage(db, USER);
    expect(after.apiCalls).toBe(before.apiCalls + 2);
    expect(after.renders).toBe(before.renders + 1);
    expect(after.day).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("api contract", () => {
  const appDir = path.join(process.cwd(), "app", "api");
  const documented = Object.keys(openapiDocument.paths);

  it("documents every SDK path", () => {
    const sdkPaths = new Set<string>(Object.values(PATHS));
    for (const p of sdkPaths) expect(documented).toContain(p);
  });

  it("implements every documented path in a route file", () => {
    for (const p of documented) {
      const segs = p
        .replace(/^\//, "")
        .split("/")
        .map((s) => (s.startsWith("{") ? `[${s.slice(1, -1)}]` : s));
      const dir = path.join(appDir, ...segs);
      if (existsSync(path.join(dir, "route.ts"))) continue;
      // Catalog endpoints share one dynamic segment: app/api/v1/[kind]/route.ts
      const parent = path.dirname(dir);
      const dynamic = existsSync(parent)
        ? readdirSync(parent).filter((d) => d.startsWith("[") && existsSync(path.join(parent, d, "route.ts")))
        : [];
      expect(dynamic, `no route file for ${p}`).not.toHaveLength(0);
    }
  });

  it("keeps catalogs in sync with the shared constants", () => {
    const catalog = JSON.stringify({
      themes: THEMES,
      fonts: FONTS.map(({ id, label, ligatures }) => ({ id, label, ligatures })),
      languages: LANGUAGES,
    });
    expect(catalog).toContain(THEMES[0]);
    expect(catalog).toContain(FONTS[0]!.id);
    expect(catalog).toContain(LANGUAGES[1]);
  });
});