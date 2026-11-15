// Upload storage: plain files on local disk (native deploy, both services on the same
// host). R2/migration later if needed. Pro-only (entitlement checked by callers).
import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { tables, type Database } from "@code2img/db";

export const MAX_UPLOAD_BYTES = 2 * 1024 * 1024; // 2 MB

export const ALLOWED_MIME = new Set(["image/png", "image/jpeg", "image/webp"]);

// Magic-byte sniffing: never trust the client's Content-Type.
export function sniffMime(buf: Uint8Array): string | null {
  if (buf.length < 12) return null;
  const b = buf;
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return "image/png";
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  const riff = b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46;
  const webp = b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50;
  if (riff && webp) return "image/webp";
  return null;
}

export function uploadsDir(): string {
  return process.env.UPLOADS_DIR ?? path.join(process.cwd(), "data", "uploads");
}

const EXT: Record<string, string> = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" };

// Returns the storage filename (<sha-prefix>-<uuid>.<ext>) or null when the upload is invalid.
// kind is recorded by callers in the uploads table; the file itself is kind-agnostic.
export async function storeUpload(buf: Uint8Array, _kind: "logo" | "background"): Promise<string | null> {
  if (buf.length === 0 || buf.length > MAX_UPLOAD_BYTES) return null;
  const mime = sniffMime(buf);
  if (!mime || !ALLOWED_MIME.has(mime)) return null;
  const name = `${createHash("sha256").update(buf).digest("hex").slice(0, 12)}-${randomUUID()}.${EXT[mime]}`;
  const dir = uploadsDir();
  await mkdir(dir, { recursive: true });
  // Filenames are generated here (never client input) before hitting the filesystem.
  await writeFile(path.join(dir, name), buf);
  return name;
}

export async function readUpload(name: string): Promise<{ buf: Buffer; mime: string } | null> {
  if (!/^[\w-]+\.(png|jpe?g|webp)$/.test(name)) return null;
  try {
    return { buf: await readFile(path.join(uploadsDir(), name)), mime: mimeFor(name) };
  } catch {
    return null;
  }
}

function mimeFor(name: string): string {
  if (name.endsWith(".png")) return "image/png";
  if (name.endsWith(".jpg") || name.endsWith(".jpeg")) return "image/jpeg";
  return "image/webp";
}

// Shared by /api/uploads (dashboard session) and /api/v1/uploads (API key).
// Callers do the entitlement check; this does the validation and the two writes.
export async function saveUpload(
  db: Database,
  userId: string,
  form: FormData | null,
): Promise<{ ok: true; id: string; file: string; kind: string } | { ok: false; status: number; detail: string }> {
  const file = form?.get("file");
  const kind = form?.get("kind");
  if (!(file instanceof File) || (kind !== "logo" && kind !== "background")) {
    return { ok: false, status: 400, detail: "file and kind (logo|background) required" };
  }
  if (file.size > MAX_UPLOAD_BYTES) return { ok: false, status: 413, detail: "file too large (max 2 MB)" };
  const buf = new Uint8Array(await file.arrayBuffer());
  const storageKey = await storeUpload(buf, kind);
  if (!storageKey) return { ok: false, status: 415, detail: "invalid image (png/jpeg/webp only)" };
  const id = randomUUID();
  await db.insert(tables.uploads).values({ id, userId, kind, storageKey, mime: file.type || "image/png", bytes: buf.length });
  return { ok: true, id, file: storageKey, kind };
}
