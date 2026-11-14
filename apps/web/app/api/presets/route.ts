// Presets CRUD (auth). Pro = unlimited (enforced with maxPresets).
import { desc, eq } from "drizzle-orm";
import { getDb, tables } from "@code2img/db";
import { cardConfigSchema, maxPresets } from "@code2img/shared";
import { currentUserFor, planOf, serviceUnavailable } from "@/lib/session";

export async function GET(req: Request) {
  const db = getDb();
  if (!db) return serviceUnavailable();
  const user = await currentUserFor(req);
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });
  const rows = await db.select().from(tables.presets).where(eq(tables.presets.userId, user.id)).orderBy(desc(tables.presets.createdAt));
  return Response.json({ presets: rows });
}

export async function POST(req: Request) {
  const db = getDb();
  if (!db) return serviceUnavailable();
  const user = await currentUserFor(req);
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });
  const { name, config } = (await req.json().catch(() => ({}))) as { name?: string; config?: unknown };
  if (!name || name.length > 80) return Response.json({ error: "name required (max 80)" }, { status: 400 });
  const parsed = cardConfigSchema.safeParse(config);
  if (!parsed.success) return Response.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  const existing = await db.select({ id: tables.presets.id }).from(tables.presets).where(eq(tables.presets.userId, user.id));
  const cap = maxPresets(planOf(user));
  if (existing.length >= cap) return Response.json({ error: `preset limit reached (${cap} on free plan)` }, { status: 402 });
  const id = crypto.randomUUID();
  await db.insert(tables.presets).values({ id, userId: user.id, name, config: parsed.data });
  return Response.json({ id, name, config: parsed.data });
}
