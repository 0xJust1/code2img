import { eq } from "drizzle-orm";
import { getDb, tables, type users } from "@code2img/db";
import { effectivePlan, type Plan, maxScale, can, type Feature } from "@code2img/shared";
import { getAuth } from "./auth";

export type User = typeof users.$inferSelect;

export function serviceUnavailable() {
  return Response.json({ error: "service unavailable: database not configured" }, { status: 503 });
}

export async function currentUserFor(req: Request): Promise<User | null> {
  const auth = getAuth();
  const db = getDb();
  if (!auth || !db) return null;
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user?.id) return null;
  const [user] = await db.select().from(tables.users).where(eq(tables.users.id, session.user.id)).limit(1);
  return user ?? null;
}

export function planOf(user: User): Plan {
  return effectivePlan({
    plan: user.plan,
    subscriptionStatus: user.subscriptionStatus,
    periodEnd: user.periodEnd,
    graceUntil: user.graceUntil,
  });
}

export function entitlementsOf(user: User) {
  const plan = planOf(user);
  return { plan, maxScale: maxScale(plan), can: (f: Feature) => can(plan, f) };
}
