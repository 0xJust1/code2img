// DELETE /api/me/keys/{id} — revoke. The key stops working immediately.
import { getDb } from "@code2img/db";
import { currentUserFor, serviceUnavailable } from "@/lib/session";
import { revokeApiKey } from "@/lib/api/keys";

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const db = getDb();
  if (!db) return serviceUnavailable();
  const user = await currentUserFor(req);
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await params;
  const ok = await revokeApiKey(db, user.id, id);
  if (!ok) return Response.json({ error: "key not found" }, { status: 404 });
  return new Response(null, { status: 204 });
}