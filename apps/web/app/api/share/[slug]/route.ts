// Owner-only deletion of a public share link (soft delete + bytes removed).
import { getDb } from "@code2img/db";
import { currentUserFor, serviceUnavailable } from "@/lib/session";
import { deleteShare } from "@/lib/share-db";

export async function DELETE(req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const db = getDb();
  if (!db) return serviceUnavailable();
  const user = await currentUserFor(req);
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });
  const { slug } = await ctx.params;
  const ok = await deleteShare(db, user.id, slug);
  // Same answer for "not yours" and "does not exist": no link enumeration.
  if (!ok) return Response.json({ error: "not found" }, { status: 404 });
  return Response.json({ ok: true });
}