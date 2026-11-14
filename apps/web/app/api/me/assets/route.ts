// Uploaded assets list for the dashboard.
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
    .from(tables.uploads)
    .where(eq(tables.uploads.userId, user.id))
    .orderBy(desc(tables.uploads.createdAt));
  return Response.json({ uploads: rows });
}
