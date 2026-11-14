// Render history for the dashboard (most recent first, capped).
import { desc, eq } from "drizzle-orm";
import { getDb, tables } from "@code2img/db";
import { currentUserFor, serviceUnavailable } from "@/lib/session";

export async function GET(req: Request) {
  const db = getDb();
  if (!db) return serviceUnavailable();
  const user = await currentUserFor(req);
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });
  const rows = await db
    .select()
    .from(tables.images)
    .where(eq(tables.images.userId, user.id))
    .orderBy(desc(tables.images.createdAt))
    .limit(50);
  return Response.json({ history: rows });
}
