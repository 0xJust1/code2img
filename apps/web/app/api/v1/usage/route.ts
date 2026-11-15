// GET /api/v1/usage — today's counters plus the quota this key runs against.
import { apiLimits } from "@code2img/shared";
import { guard, readUsage } from "@/lib/api/guard";
import { listApiKeys } from "@/lib/api/keys";

export async function GET(req: Request) {
  const g = await guard(req, { scope: "read" });
  if (!g.ok) return g.response;
  const usage = await readUsage(g.ctx.db, g.ctx.user.id);
  const limits = apiLimits(g.ctx.plan);
  const keys = await listApiKeys(g.ctx.db, g.ctx.user.id);
  return Response.json(
    {
      plan: g.ctx.plan,
      day: usage.day,
      api_calls: usage.apiCalls,
      renders: usage.renders,
      limits: {
        per_minute: limits.perMinute,
        per_day: limits.perDay,
        remaining_minute: Number(g.ctx.headers["x-ratelimit-remaining"] ?? 0),
        remaining_day: Math.max(0, limits.perDay - usage.apiCalls),
      },
      keys: keys.filter((k) => !k.revokedAt).map((k) => ({ prefix: k.prefix, scopes: k.scopes, last_used_at: k.lastUsedAt })),
    },
    { headers: g.ctx.headers },
  );
}