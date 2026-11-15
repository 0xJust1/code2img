// /api/v1/share — public share pages created with an API key (the MCP tools use these).
// Same render pipeline and same share rows as the session route (/api/share); only the
// auth differs, so the code is never stored and expiry/UTM rules stay identical.
import { cardConfigSchema } from "@code2img/shared";
import { guard } from "@/lib/api/guard";
import { problem } from "@/lib/api/problem";
import { renderCard } from "@/lib/render";
import { createShare, listShares, type ShareFormat } from "@/lib/share-db";
import { cleanUtm, publicUrl } from "@/lib/share";

export async function POST(req: Request) {
  const g = await guard(req, { scope: "write" });
  if (!g.ok) return g.response;

  let body: { config?: unknown; code?: unknown; language?: unknown; theme?: unknown; font?: unknown; title?: unknown; format?: string; scale?: number; expiry?: string; utm?: unknown };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return problem(400, "Invalid body", "Body must be JSON.");
  }

  const config = body.config ?? { code: body.code, language: body.language, theme: body.theme, font: body.font, title: body.title };
  const parsed = cardConfigSchema.safeParse(config);
  if (!parsed.success) {
    return problem(400, "Invalid config", parsed.error.issues.map((i) => `${i.path.join(".") || "config"}: ${i.message}`).join("; "));
  }

  const format: ShareFormat = body.format === "jpg" ? "jpg" : "png"; // OG needs a raster image
  const res = await renderCard(req, { config: parsed.data, format, scale: body.scale }, { history: false, user: g.ctx.user });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    return problem(res.status === 504 ? 504 : 400, "Render failed", err.error ?? `render service answered ${res.status}`);
  }

  const share = await createShare(g.ctx.db, {
    userId: g.ctx.user.id,
    bytes: new Uint8Array(await res.arrayBuffer()),
    format,
    visualConfig: parsed.data as unknown as Record<string, unknown>,
    expiry: body.expiry,
    utm: cleanUtm(body.utm),
  });
  return Response.json(
    { slug: share.slug, url: publicUrl(share.slug), path: `/i/${share.slug}`, expiresAt: share.expiresAt },
    { status: 201, headers: g.ctx.headers },
  );
}

export async function GET(req: Request) {
  const g = await guard(req, { scope: "read" });
  if (!g.ok) return g.response;
  const shares = await listShares(g.ctx.db, g.ctx.user.id);
  return Response.json(
    {
      shares: shares.map((s) => ({
        slug: s.slug,
        url: publicUrl(s.slug),
        state: s.state,
        expires_at: s.expiresAt,
        created_at: s.createdAt,
      })),
    },
    { headers: g.ctx.headers },
  );
}