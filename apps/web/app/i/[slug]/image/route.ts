// Serves the stored share image publicly. 404 once the link is expired or deleted,
// so an old URL can never keep leaking the image.
import { getDb } from "@code2img/db";
import { loadShare, readShareImage } from "@/lib/share-db";

export async function GET(_req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const db = getDb();
  if (!db) return new Response("not found", { status: 404 });
  const { slug } = await ctx.params;
  const share = await loadShare(db, slug);
  if (!share || share.state !== "active") return new Response("not found", { status: 404 });
  const image = await readShareImage(share.storageKey);
  if (!image) return new Response("not found", { status: 404 });
  return new Response(new Uint8Array(image.buf), {
    headers: {
      "content-type": image.mime,
      // Short cache: expiry and deletion must take effect quickly.
      "cache-control": "public, max-age=300",
      "content-security-policy": "default-src 'none'",
    },
  });
}