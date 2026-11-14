// Pro-only asset uploads (logo / custom background). Stored on local disk.
import { getDb, tables } from "@code2img/db";
import { can } from "@code2img/shared";
import { currentUserFor, planOf, serviceUnavailable } from "@/lib/session";
import { MAX_UPLOAD_BYTES, storeUpload } from "@/lib/uploads";

export async function POST(req: Request) {
  const db = getDb();
  if (!db) return serviceUnavailable();
  const user = await currentUserFor(req);
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });
  if (!can(planOf(user), "custom-logo")) {
    return Response.json({ error: "pro plan required" }, { status: 402 });
  }
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  const kind = form?.get("kind");
  if (!(file instanceof File) || (kind !== "logo" && kind !== "background")) {
    return Response.json({ error: "file and kind (logo|background) required" }, { status: 400 });
  }
  if (file.size > MAX_UPLOAD_BYTES) return Response.json({ error: "file too large (max 2 MB)" }, { status: 413 });
  const buf = new Uint8Array(await file.arrayBuffer());
  const storageKey = await storeUpload(buf, kind);
  if (!storageKey) return Response.json({ error: "invalid image (png/jpeg/webp only)" }, { status: 415 });
  const id = crypto.randomUUID();
  await db.insert(tables.uploads).values({ id, userId: user.id, kind, storageKey, mime: file.type || "image/png", bytes: buf.length });
  return Response.json({ id, file: storageKey, kind });
}
