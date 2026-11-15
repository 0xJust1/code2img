// API key management for the dashboard (session cookie auth, not API key auth).
import { getDb } from "@code2img/db";
import { currentUserFor, serviceUnavailable } from "@/lib/session";
import { createApiKey, listApiKeys } from "@/lib/api/keys";

export async function GET(req: Request) {
  const db = getDb();
  if (!db) return serviceUnavailable();
  const user = await currentUserFor(req);
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });
  return Response.json({ keys: await listApiKeys(db, user.id) });
}

export async function POST(req: Request) {
  const db = getDb();
  if (!db) return serviceUnavailable();
  const user = await currentUserFor(req);
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as { scopes?: unknown };
  const key = await createApiKey(db, user.id, body.scopes);
  // The plaintext key is returned exactly once — it is not stored anywhere.
  return Response.json(key, { status: 201 });
}