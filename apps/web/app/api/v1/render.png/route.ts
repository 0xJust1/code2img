// GET /api/v1/render.png?code=…&sig=… — lightweight, embeddable, signature-gated.
// No API key: the HMAC binds one exact snippet, so the URL can live in a README forever
// while arbitrary snippets stay refused. Base64 code keeps the query string short.
import { cardConfigSchema, gradientPresets } from "@code2img/shared";
import { publicGuard } from "@/lib/api/guard";
import { problem } from "@/lib/api/problem";
import { SIGNED_PARAMS, type SignedParams, verify } from "@/lib/api/sign";
import { renderCard } from "@/lib/render";

const PRESETS = new Set<string>(gradientPresets.map((g) => g.id));

export async function GET(req: Request) {
  const g = await publicGuard(req);
  if (!g.ok) return g.response;
  const q = new URL(req.url).searchParams;
  const params: SignedParams = {};
  for (const k of SIGNED_PARAMS) params[k] = q.get(k) ?? undefined;
  // `code` may be sent base64url-encoded to survive long snippets in the query string.
  if (q.get("b64") === "1" && params.code) {
    params.code = Buffer.from(params.code, "base64url").toString("utf8");
  }
  if (!verify(params, q.get("sig") ?? "", process.env.RENDER_SIGN_SECRET)) {
    return problem(403, "Invalid signature", "Signed URL required: create one with POST /api/v1/signed-url.");
  }

  const size = Number(params.fontSize);
  const config = {
    code: params.code ?? "",
    language: params.lang ?? "auto",
    theme: params.theme ?? "github-dark",
    font: params.font ?? "jetbrains-mono",
    ...(Number.isFinite(size) && size >= 10 && size <= 24 ? { fontSize: size } : {}),
    title: params.title ?? "",
    watermark: params.watermark !== "0",
    ...(params.bg && PRESETS.has(params.bg) ? { background: { type: "gradient", preset: params.bg } } : {}),
  };
  const parsed = cardConfigSchema.safeParse(config);
  if (!parsed.success) return problem(400, "Invalid render parameters", parsed.error.issues[0]?.message);

  const res = await renderCard(req, { config }, { history: false, user: null });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    return problem(504, "Render failed", err.error ?? "render service unavailable");
  }
  return new Response(res.body, {
    status: 200,
    headers: { ...g.headers, "content-type": res.headers.get("content-type") ?? "image/png", "cache-control": "public, max-age=86400" },
  });
}