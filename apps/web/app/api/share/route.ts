// Create a public share link: render once, keep the image, drop the code.
import { cardConfigSchema } from "@code2img/shared";
import { getDb } from "@code2img/db";
import { currentUserFor, serviceUnavailable } from "@/lib/session";
import { renderCard } from "@/lib/render";
import { createShare, type ShareFormat } from "@/lib/share-db";
import { cleanUtm, publicUrl } from "@/lib/share";

export async function POST(req: Request) {
  const db = getDb();
  if (!db) return serviceUnavailable();
  const user = await currentUserFor(req);
  if (!user) return Response.json({ error: "sign in to create a public link" }, { status: 401 });

  let body: { config?: unknown; format?: string; scale?: number; quality?: number; expiry?: string; utm?: unknown };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "invalid body" }, { status: 400 });
  }
  const parsed = cardConfigSchema.safeParse(body.config);
  if (!parsed.success) return Response.json({ error: parsed.error.issues[0]?.message }, { status: 400 });

  const format: ShareFormat = body.format === "jpg" ? "jpg" : "png"; // OG needs a raster image
  const res = await renderCard(req, { config: body.config, format, scale: body.scale, quality: body.quality }, { history: false });
  if (!res.ok) return res;
  const bytes = new Uint8Array(await res.arrayBuffer());

  const share = await createShare(db, {
    userId: user.id,
    bytes,
    format,
    visualConfig: parsed.data as unknown as Record<string, unknown>,
    expiry: body.expiry,
    utm: cleanUtm(body.utm),
  });
  return Response.json({ slug: share.slug, url: publicUrl(share.slug), path: `/i/${share.slug}`, expiresAt: share.expiresAt });
}