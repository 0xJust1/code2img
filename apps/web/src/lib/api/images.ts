// API images: rendered bytes persisted under an unguessable id (response_type=url).
// The code is never stored — same privacy rule as public share links.
import { createHash, randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { tables, type Database } from "@code2img/db";
import { deleteObject, getObject, putObject } from "../storage";

export const API_IMAGE_TTL_MS = 30 * 24 * 3600 * 1000;
export const ID_RE = /^[0-9a-f-]{36}$/i;

const EXT: Record<string, string> = { png: "png", jpg: "jpg", pdf: "pdf", webm: "webm", mp4: "mp4" };
const MIME: Record<string, string> = { png: "image/png", jpg: "image/jpeg", pdf: "application/pdf", webm: "video/webm", mp4: "video/mp4" };

export function formatOf(format: string | undefined): "png" | "jpg" | "pdf" | "webm" | "mp4" {
  if (format === "jpg" || format === "pdf" || format === "webm" || format === "mp4") return format;
  return "png";
}

export async function saveImage(
  db: Database,
  opts: { userId: string; bytes: Uint8Array; format: "png" | "jpg" | "pdf" | "webm" | "mp4"; config: Record<string, unknown> },
): Promise<{ id: string; format: string; expiresAt: Date }> {
  const id = randomUUID();
  const storageKey = `${id}.${EXT[opts.format]}`;
  await putObject(storageKey, opts.bytes);
  const expiresAt = new Date(Date.now() + API_IMAGE_TTL_MS);
  await db.insert(tables.images).values({
    id,
    userId: opts.userId,
    configHash: createHash("sha256")
      .update(JSON.stringify({ ...opts.config, code: "" }))
      .digest("hex"),
    config: null,
    storageKey,
    format: opts.format,
    expiresAt,
  });
  return { id, format: opts.format, expiresAt };
}

/** Expired images are refused and removed on read (no cron needed at this scale). */
export async function readImage(db: Database, id: string): Promise<{ buf: Buffer; mime: string; expiresAt: Date | null } | null> {
  if (!ID_RE.test(id)) return null;
  const [row] = await db.select().from(tables.images).where(eq(tables.images.id, id)).limit(1);
  if (!row?.storageKey) return null;
  if (row.expiresAt && row.expiresAt.getTime() < Date.now()) {
    await deleteObject(row.storageKey);
    await db.delete(tables.images).where(eq(tables.images.id, id));
    return null;
  }
  const buf = await getObject(row.storageKey);
  if (!buf) return null;
  return { buf, mime: MIME[row.format] ?? "application/octet-stream", expiresAt: row.expiresAt };
}

/** Owner only. Returns false when the id is unknown or belongs to someone else. */
export async function deleteImage(db: Database, userId: string, id: string): Promise<boolean> {
  if (!ID_RE.test(id)) return false;
  const [row] = await db.select().from(tables.images).where(eq(tables.images.id, id)).limit(1);
  if (!row || row.userId !== userId) return false;
  if (row.storageKey) await deleteObject(row.storageKey);
  await db.delete(tables.images).where(eq(tables.images.id, id));
  return true;
}