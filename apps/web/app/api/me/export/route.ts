// RGPD: full account export as JSON (presets, uploads meta, render history, keys).
import { eq } from "drizzle-orm";
import { getDb, tables } from "@code2img/db";
import { currentUserFor, serviceUnavailable } from "@/lib/session";

export async function GET(req: Request) {
  const db = getDb();
  if (!db) return serviceUnavailable();
  const user = await currentUserFor(req);
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });
  const [presets, uploads, keys, history] = await Promise.all([
    db.select().from(tables.presets).where(eq(tables.presets.userId, user.id)),
    db.select().from(tables.uploads).where(eq(tables.uploads.userId, user.id)),
    db.select().from(tables.apiKeys).where(eq(tables.apiKeys.userId, user.id)),
    db.select().from(tables.images).where(eq(tables.images.userId, user.id)),
  ]);
  const { id, email, name, plan, createdAt, subscriptionStatus, periodEnd, graceUntil } = user;
  return new Response(
    JSON.stringify({ account: { id, email, name, plan, subscriptionStatus, periodEnd, graceUntil, createdAt }, presets, uploads, apiKeys: keys.map((k) => ({ ...k, keyHash: "[redacted]" })), renderHistory: history }, null, 2),
    { headers: { "content-type": "application/json", "content-disposition": `attachment; filename="code2img-export.json"` } },
  );
}
