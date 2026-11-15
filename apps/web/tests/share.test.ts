import { beforeAll, describe, expect, it } from "vitest";
import { mkdtemp } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { eq } from "drizzle-orm";
import { createTestDb, tables, type Database } from "@code2img/db";
import { createShare, deleteShare, loadShare, readShareImage } from "../src/lib/share-db";
import { cleanUtm, expiryFrom, shareState, trackedUrl } from "../src/lib/share";

process.env.SHARE_IMAGES_DIR = await mkdtemp(path.join(os.tmpdir(), "c2i-share-"));
process.env.APP_URL = "https://code2img.app";

const db = (await createTestDb()) as unknown as Database;
const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3]);
const OWNER = "u_share_owner";
const OTHER = "u_share_other";

beforeAll(async () => {
  await db.insert(tables.users).values([
    { id: OWNER, email: "owner@example.com", name: "Owner" },
    { id: OTHER, email: "other@example.com", name: "Other" },
  ]);
});

const visual = (theme = "github-dark") => ({ code: "console.log('secret')", theme, font: "jetbrains-mono" });

describe("expiryFrom", () => {
  it("maps presets to dates and garbage to 7 days (never forever)", () => {
    const now = new Date("2026-01-01T00:00:00Z");
    expect(expiryFrom("1d", now)!.toISOString()).toBe("2026-01-02T00:00:00.000Z");
    expect(expiryFrom("30d", now)!.toISOString()).toBe("2026-01-31T00:00:00.000Z");
    expect(expiryFrom("never", now)).toBeNull();
    expect(expiryFrom("bogus", now)!.toISOString()).toBe("2026-01-08T00:00:00.000Z");
    expect(expiryFrom(undefined, now)!.toISOString()).toBe("2026-01-08T00:00:00.000Z");
  });
});

describe("shareState", () => {
  it("distinguishes active, expired and deleted", () => {
    const now = new Date("2026-01-01T00:00:00Z");
    expect(shareState({ expiresAt: null, deletedAt: null }, now)).toBe("active");
    expect(shareState({ expiresAt: new Date("2026-02-01T00:00:00Z"), deletedAt: null }, now)).toBe("active");
    expect(shareState({ expiresAt: new Date("2025-12-31T00:00:00Z"), deletedAt: null }, now)).toBe("expired");
    expect(shareState({ expiresAt: null, deletedAt: new Date("2025-12-31T00:00:00Z") }, now)).toBe("deleted");
  });
});

describe("trackedUrl / cleanUtm", () => {
  it("tags every network with its own utm_source", () => {
    expect(trackedUrl("abc", "x", { campaign: "launch" })).toBe(
      "https://code2img.app/i/abc?utm_source=x&utm_medium=social&utm_campaign=launch",
    );
    expect(trackedUrl("abc", "hn", null)).toBe("https://code2img.app/i/abc?utm_source=hn&utm_medium=social");
  });

  it("keeps utm values url-safe and drops empty sets", () => {
    expect(cleanUtm({ campaign: " launch 2026! " })).toEqual({ campaign: "launch-2026" });
    expect(cleanUtm({ source: "" })).toBeNull();
    expect(cleanUtm("nope")).toBeNull();
    expect(cleanUtm(undefined)).toBeNull();
  });
});

describe("share lifecycle", () => {
  it("creates a link, serves the bytes and never persists the code", async () => {
    const share = await createShare(db, {
      userId: OWNER,
      bytes: PNG,
      format: "png",
      visualConfig: visual(),
      expiry: "7d",
      utm: { campaign: "launch" },
    });
    expect(share.slug).toMatch(/^[\w-]{11}$/);
    expect(share.storageKey).toBe(`${share.slug}.png`);

    const found = await loadShare(db, share.slug);
    expect(found?.state).toBe("active");
    expect(found?.ownerId).toBe(OWNER);
    expect(found?.utm).toEqual({ campaign: "launch" });

    const image = await readShareImage(share.storageKey);
    expect(image?.mime).toBe("image/png");
    expect(Buffer.compare(image!.buf, Buffer.from(PNG))).toBe(0);

    // Privacy: the stored rows keep no config at all, only a hash of the visual config.
    const [row] = await db.select().from(tables.images).where(eq(tables.images.storageKey, share.storageKey));
    expect(row!.config).toBeNull();
    expect(row!.configHash).toHaveLength(64);
  });

  it("expires an old link without deleting its rows", async () => {
    const share = await createShare(db, { userId: OWNER, bytes: PNG, format: "png", visualConfig: visual(), expiry: "1d" });
    await db
      .update(tables.shareLinks)
      .set({ expiresAt: new Date(Date.now() - 1000) })
      .where(eq(tables.shareLinks.slug, share.slug));
    expect((await loadShare(db, share.slug))?.state).toBe("expired");
  });

  it("only the owner can delete, and deletion removes the bytes", async () => {
    const share = await createShare(db, { userId: OWNER, bytes: PNG, format: "png", visualConfig: visual(), expiry: "never" });

    expect(await deleteShare(db, OTHER, share.slug)).toBe(false);
    expect((await loadShare(db, share.slug))?.state).toBe("active");

    expect(await deleteShare(db, OWNER, share.slug)).toBe(true);
    expect((await loadShare(db, share.slug))?.state).toBe("deleted");
    expect(await readShareImage(share.storageKey)).toBeNull();
    expect(await deleteShare(db, OWNER, share.slug)).toBe(true); // idempotent
  });

  it("returns null for an unknown slug", async () => {
    expect(await loadShare(db, "doesnotexist")).toBeNull();
  });
});