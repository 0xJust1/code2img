// The single render entry point for the web app: entitlements, config validation,
// asset resolution and the proxy to the render service. Used by /api/render (export)
// and /api/share (public link), so the trust boundary exists exactly once.
import { cardConfigSchema, maxScale, FREE_MAX_ANIM_DURATION_MS, PRO_MAX_ANIM_DURATION_MS, type Plan } from "@code2img/shared";
import { getDb, tables } from "@code2img/db";
import { and, eq } from "drizzle-orm";
import { createHash } from "node:crypto";
import { currentUserFor, planOf, type User } from "./session";
import { readUpload } from "./uploads";

const RENDER_URL = process.env.RENDER_URL ?? "http://localhost:3002";

export interface RenderInput {
  config?: unknown;
  format?: string;
  scale?: number;
  quality?: number;
  anim?: { type: "typewriter"; durationMs: number };
}

/** Returns the render response, or an error response ready to be returned as-is. */
export async function renderCard(
  req: Request,
  body: RenderInput,
  opts: { history: boolean; user?: User | null },
): Promise<Response> {
  const db = getDb();
  // API-key callers pass their user explicitly (no session cookie on /api/v1).
  const user = opts.user !== undefined ? opts.user : db ? await currentUserFor(req) : null;
  const plan: Plan = user ? planOf(user) : "free";
  const trusted = plan === "pro";

  // Config is always re-validated here (trust boundary).
  const parsed = cardConfigSchema.safeParse(body.config);
  if (!parsed.success) return Response.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  let config = parsed.data;

  // Scale cap from entitlements; pdf kept available (scale 1) on the free tier.
  const max = maxScale(plan);
  if (typeof body.scale === "number" && body.scale > max) body.scale = max;

  // Free tier: strip Pro-only references before anything leaves this process.
  // The render service trusts this app's internal token, so the watermark is enforced HERE.
  if (!trusted) {
    config.watermark = true;
    if (config.logo) delete config.logo;
    if (config.background.type === "image") config = { ...config, background: { type: "solid", color: "#1e1e2e" } };
  }

  // Animation caps by tier
  let anim = body.anim;
  if (anim) {
    const maxDur = trusted ? PRO_MAX_ANIM_DURATION_MS : FREE_MAX_ANIM_DURATION_MS;
    anim = { type: "typewriter", durationMs: Math.min(anim.durationMs, maxDur) };
    // Free tier: only webm allowed
    if (!trusted && body.format !== "webm") {
      return Response.json({ error: "animated exports on the free tier are WebM only — upgrade to Pro for MP4" }, { status: 402 });
    }
  }

  // Resolve uploaded assets server-side; only files owned by this user are attached.
  const attachments: Record<string, string> = {};
  if (trusted && db && user) {
    const cfg = config as { logo?: string; background?: { type: string; file?: string } };
    const files = new Set<string>();
    if (cfg.logo) files.add(cfg.logo);
    if (cfg.background?.type === "image" && cfg.background.file) files.add(cfg.background.file);
    for (const file of files) {
      const [row] = await db
        .select()
        .from(tables.uploads)
        .where(and(eq(tables.uploads.userId, user.id), eq(tables.uploads.storageKey, file)))
        .limit(1);
      if (!row) continue;
      const asset = await readUpload(file);
      if (asset) attachments[file] = `data:${asset.mime};base64,${asset.buf.toString("base64")}`;
    }
  }

  const res = await fetch(`${RENDER_URL}/render`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(process.env.RENDER_INTERNAL_TOKEN ? { "x-internal-token": process.env.RENDER_INTERNAL_TOKEN } : {}),
    },
    body: JSON.stringify({ ...body, config, attachments: trusted ? attachments : undefined, anim }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "render failed" }));
    return Response.json(err, { status: res.status });
  }
  // History row (dashboard). Logged-in renders only.
  if (opts.history && db && user) {
    await db
      .insert(tables.images)
      .values({
        id: crypto.randomUUID(),
        userId: user.id,
        configHash: createHash("sha256").update(JSON.stringify(config)).digest("hex"),
        config: config as unknown as Record<string, unknown>,
        format: body.format ?? "png",
      })
      .catch(() => undefined); // history must never break a render
  }
  return new Response(res.body, {
    status: 200,
    headers: {
      "content-type": res.headers.get("content-type") ?? "application/octet-stream",
      "cache-control": "private, max-age=0",
    },
  });
}