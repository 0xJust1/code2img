// POST /api/v1/images — the API's main entry point: render one card.
// response_type=binary (default) streams the image; url/json persists it and returns a link.
import { cardConfigSchema } from "@code2img/shared";
import { renderCard } from "@/lib/render";
import { guard } from "@/lib/api/guard";
import { problem } from "@/lib/api/problem";
import { findReplay, remember, requestHash } from "@/lib/api/idempotency";
import { formatOf, readImage, saveImage } from "@/lib/api/images";

export async function POST(req: Request) {
  const g = await guard(req, { scope: "write" });
  if (!g.ok) return g.response;
  const { ctx } = g;

  let raw: Record<string, unknown>;
  try {
    raw = (await req.json()) as Record<string, unknown>;
  } catch {
    return problem(400, "Invalid body", "Body must be JSON.");
  }

  // Idempotency: same key + same body replays; same key + different body is a 422.
  const idemKey = req.headers.get("idempotency-key");
  let hash = "";
  if (idemKey) {
    if (idemKey.length > 200) return problem(400, "Invalid Idempotency-Key");
    hash = requestHash(raw);
    const found = await findReplay(ctx.db, ctx.user.id, idemKey, "POST /v1/images", hash);
    if (found && "mismatch" in found) {
      return problem(422, "Idempotency key reused", "This Idempotency-Key was already used with a different body.");
    }
    if (found?.replay) {
      const stored = found.replay;
      if (typeof stored.body?.imageId === "string") {
        const img = await readImage(ctx.db, stored.body.imageId);
        if (img) {
          return new Response(new Uint8Array(img.buf), {
            status: stored.status,
            headers: { ...ctx.headers, "content-type": img.mime, "idempotency-replayed": "true" },
          });
        }
      }
      return Response.json(stored.body, { status: stored.status, headers: { ...ctx.headers, "idempotency-replayed": "true" } });
    }
  }

  // Convenience: `code` (+lang/theme/font/title) as an alternative to a full `config`.
  const config = raw.config ?? { code: raw.code, language: raw.language, theme: raw.theme, font: raw.font, fontSize: raw.fontSize, title: raw.title };
  const parsed = cardConfigSchema.safeParse(config);
  if (!parsed.success) {
    return problem(400, "Invalid config", parsed.error.issues.map((i) => `${i.path.join(".") || "config"}: ${i.message}`).join("; "));
  }

  const format = formatOf(typeof raw.format === "string" ? raw.format : undefined);
  const res = await renderCard(req, { config, format, scale: raw.scale as number | undefined, quality: raw.quality as number | undefined }, { history: false, user: ctx.user });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    return problem(res.status === 504 ? 504 : 400, "Render failed", err.error ?? `render service answered ${res.status}`);
  }
  const bytes = new Uint8Array(await res.arrayBuffer());
  const responseType = raw.response_type === "url" || raw.response_type === "json" ? "url" : "binary";
  const persist = responseType === "url" || Boolean(idemKey);

  if (!persist) {
    const out: Record<string, string> = {
      ...ctx.headers,
      "content-type": res.headers.get("content-type") ?? "image/png",
      "cache-control": "private, max-age=0",
    };
    return new Response(bytes, { status: 200, headers: out });
  }

  const saved = await saveImage(ctx.db, { userId: ctx.user.id, bytes, format, config: parsed.data as unknown as Record<string, unknown> });
  if (idemKey) await remember(ctx.db, ctx.user.id, idemKey, "POST /v1/images", hash, { status: 200, body: { imageId: saved.id } });

  if (responseType === "binary") {
    return new Response(bytes, {
      status: 200,
      headers: { ...ctx.headers, "content-type": res.headers.get("content-type") ?? "image/png", "cache-control": "private, max-age=0" },
    });
  }
  const url = `${process.env.APP_URL ?? "https://code2img.app"}/api/v1/images/${saved.id}`;
  return Response.json(
    { id: saved.id, url, format: saved.format, bytes: bytes.length, expires_at: saved.expiresAt.toISOString() },
    { status: 201, headers: ctx.headers },
  );
}