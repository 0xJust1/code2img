import { and, eq } from "drizzle-orm";
import { getDb, tables } from "@code2img/db";
import { currentUserFor, serviceUnavailable } from "@/lib/session";

export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const db = getDb();
  if (!db) return serviceUnavailable();
  const user = await currentUserFor(req);
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  await db.delete(tables.presets).where(and(eq(tables.presets.id, id), eq(tables.presets.userId, user.id)));
  return Response.json({ ok: true });
}
