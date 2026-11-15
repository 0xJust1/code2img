// POST /api/me/keys/{id}/rotate — new key with the same scopes, old one revoked.
import { getDb } from "@code2img/db";
import { currentUserFor, serviceUnavailable } from "@/lib/session";
import { rotateApiKey } from "@/lib/api/keys";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const db = getDb();
  if (!db) return serviceUnavailable();
  const user = await currentUserFor(req);
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await params;
  const key = await rotateApiKey(db, user.id, id);
  if (!key) return Response.json({ error: "active key not found" }, { status: 404 });
  return Response.json(key, { status: 201 });
}