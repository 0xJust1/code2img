// Serves an owned upload to its owner only (editor preview + assets panel).
import { and, eq } from "drizzle-orm";
import { getDb, tables } from "@code2img/db";
import { currentUserFor, serviceUnavailable } from "@/lib/session";
import { readUpload } from "@/lib/uploads";

export async function GET(req: Request, ctx: { params: Promise<{ file: string }> }) {
  const db = getDb();
  if (!db) return serviceUnavailable();
  const user = await currentUserFor(req);
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });
  const { file } = await ctx.params;
  const [row] = await db
    .select()
    .from(tables.uploads)
    .where(and(eq(tables.uploads.userId, user.id), eq(tables.uploads.storageKey, file)))
    .limit(1);
  if (!row) return Response.json({ error: "not found" }, { status: 404 });
  const asset = await readUpload(file);
  if (!asset) return Response.json({ error: "not found" }, { status: 404 });
  return new Response(new Uint8Array(asset.buf), {
    headers: { "content-type": asset.mime, "cache-control": "private, max-age=3600" },
  });
}

export async function DELETE(req: Request, ctx: { params: Promise<{ file: string }> }) {
  const db = getDb();
  if (!db) return serviceUnavailable();
  const user = await currentUserFor(req);
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });
  const { file } = await ctx.params;
  await db.delete(tables.uploads).where(and(eq(tables.uploads.userId, user.id), eq(tables.uploads.storageKey, file)));
  return Response.json({ ok: true });
}
