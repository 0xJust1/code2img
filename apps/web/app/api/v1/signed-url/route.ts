// POST /api/v1/signed-url — mint a signed /api/v1/render.png URL for a fixed snippet.
import { guard } from "@/lib/api/guard";
import { problem } from "@/lib/api/problem";
import { SIGNED_PARAMS, canonical, sign, type SignedParams } from "@/lib/api/sign";

export async function POST(req: Request) {
  const g = await guard(req, { scope: "write" });
  if (!g.ok) return g.response;
  const secret = process.env.RENDER_SIGN_SECRET;
  if (!secret) return problem(503, "Signed URLs unavailable", "RENDER_SIGN_SECRET is not configured.");

  let body: Record<string, unknown> & { b64?: boolean };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return problem(400, "Invalid body", "Body must be JSON.");
  }
  const params: SignedParams = {};
  for (const k of SIGNED_PARAMS) if (body[k] !== undefined) params[k] = String(body[k]);
  if (!params.code) return problem(400, "Missing code");

  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(canonical(params))) {
    q.set(k, body.b64 ? Buffer.from(v, "utf8").toString("base64url") : v);
  }
  if (body.b64) q.set("b64", "1");
  q.set("sig", sign(params, secret));
  const url = `${process.env.APP_URL ?? "https://code2img.app"}/api/v1/render.png?${q.toString()}`;
  return Response.json({ url, params: canonical(params) }, { status: 201, headers: g.ctx.headers });
}