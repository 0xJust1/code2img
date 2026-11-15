// Share links in the DB: create, read, owner-delete. Pure DB + storage, no HTTP,
// so the route handlers stay thin and the tests exercise the real logic.
import { eq } from "drizzle-orm";
import { tables, type Database } from "@code2img/db";
import { createHash, randomUUID } from "node:crypto";
import { deleteObject, getObject, putObject } from "./storage";
import { expiryFrom, newSlug, shareState, type ShareState } from "./share";

export type ShareFormat = "png" | "jpg";

export interface ShareRow {
  slug: string;
  storageKey: string;
  format: ShareFormat;
  expiresAt: Date | null;
  utm: Record<string, string> | null;
  ownerId: string | null;
  state: ShareState;
}

const EXT: Record<ShareFormat, string> = { png: "png", jpg: "jpg" };
const MIME: Record<ShareFormat, string> = { png: "image/png", jpg: "image/jpeg" };

export async function loadShare(db: Database, slug: string): Promise<ShareRow | null> {
  const [found] = await db
    .select({ link: tables.shareLinks, image: tables.images })
    .from(tables.shareLinks)
    .innerJoin(tables.images, eq(tables.shareLinks.imageId, tables.images.id))
    .where(eq(tables.shareLinks.slug, slug))
    .limit(1);
  if (!found) return null;
  const { link, image } = found;
  return {
    slug: link.slug,
    storageKey: image.storageKey ?? "",
    format: image.format === "jpg" ? "jpg" : "png",
    expiresAt: link.expiresAt,
    utm: link.utm ?? null,
    ownerId: image.userId,
    state: shareState(link),
  };
}

/** The caller has already rendered the image: this persists the bytes + the two rows. */
export async function createShare(
  db: Database,
  opts: {
    userId: string;
    bytes: Uint8Array;
    format: ShareFormat;
    visualConfig: Record<string, unknown>;
    expiry: string | undefined | null;
    utm?: Record<string, string> | null;
  },
): Promise<ShareRow> {
  const slug = newSlug();
  const storageKey = `${slug}.${EXT[opts.format]}`;
  await putObject(storageKey, opts.bytes);
  // Privacy: the code is never persisted — only a hash of the visual config (code blanked)
  // and the rendered image itself.
  const configHash = createHash("sha256")
    .update(JSON.stringify({ ...opts.visualConfig, code: "" }))
    .digest("hex");
  const imageId = randomUUID();
  await db.insert(tables.images).values({
    id: imageId,
    userId: opts.userId,
    configHash,
    config: null,
    storageKey,
    format: opts.format,
  });
  const expiresAt = expiryFrom(opts.expiry);
  const utm = opts.utm ?? null;
  await db.insert(tables.shareLinks).values({ id: randomUUID(), imageId, slug, expiresAt, utm });
  return { slug, storageKey, format: opts.format, expiresAt, utm, ownerId: opts.userId, state: "active" };
}

/** Soft delete (the row keeps the history), then drop the bytes. False = not found / not owner. */
export async function deleteShare(db: Database, userId: string, slug: string): Promise<boolean> {
  const found = await loadShare(db, slug);
  if (!found || found.ownerId !== userId) return false;
  await db.update(tables.shareLinks).set({ deletedAt: new Date() }).where(eq(tables.shareLinks.slug, slug));
  await deleteObject(found.storageKey);
  return true;
}

export async function readShareImage(key: string): Promise<{ buf: Buffer; mime: string } | null> {
  const buf = await getObject(key);
  if (!buf) return null;
  return { buf, mime: MIME[key.endsWith(".jpg") ? "jpg" : "png"] };
}