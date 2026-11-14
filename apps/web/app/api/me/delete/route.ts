// RGPD: hard account deletion. FK cascades remove sessions/accounts/presets/uploads/
// api_keys/images/usage_counters. Stripe subscription is canceled via the Portal.
import { eq } from "drizzle-orm";
import { getDb, tables } from "@code2img/db";
import { currentUserFor, serviceUnavailable } from "@/lib/session";

export async function POST(req: Request) {
  const db = getDb();
  if (!db) return serviceUnavailable();
  const user = await currentUserFor(req);
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });
  // Explicit confirmation word, guarded here (no silent deletes).
  const body = (await req.json().catch(() => ({}))) as { confirm?: string };
  if (body.confirm !== "DELETE") return Response.json({ error: "confirmation required" }, { status: 400 });
  await db.delete(tables.users).where(eq(tables.users.id, user.id));
  const res = Response.json({ ok: true });
  // Best-effort sign-out cookie clear (better-auth standard cookie name).
  res.headers.append(
    "set-cookie",
    `better-auth.session_token=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax`,
  );
  return res;
}
