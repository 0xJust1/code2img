// POST /api/v1/uploads — same uploads as the dashboard, authenticated by API key (Pro).
import { can } from "@code2img/shared";
import { guard } from "@/lib/api/guard";
import { problem } from "@/lib/api/problem";
import { saveUpload } from "@/lib/uploads";

export async function POST(req: Request) {
  const g = await guard(req, { scope: "upload" });
  if (!g.ok) return g.response;
  if (!can(g.ctx.plan, "custom-logo")) return problem(402, "Pro plan required", "Uploads are a Pro feature.");
  const result = await saveUpload(g.ctx.db, g.ctx.user.id, await req.formData().catch(() => null));
  if (!result.ok) return problem(result.status, "Upload rejected", result.detail);
  return Response.json({ id: result.id, file: result.file, kind: result.kind }, { status: 201, headers: g.ctx.headers });
}