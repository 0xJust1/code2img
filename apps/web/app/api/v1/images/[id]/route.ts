// GET /api/v1/images/{id} is public — the uuid is the capability (unguessable, 30-day TTL),
// which is what makes response_type=url embeddable. DELETE requires the owning API key.
import { guard, publicGuard } from "@/lib/api/guard";
import { problem } from "@/lib/api/problem";
import { deleteImage, readImage } from "@/lib/api/images";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await publicGuard(req);
  if (!g.ok) return g.response;
  const { id } = await params;
  const db = (await import("@code2img/db")).getDb();
  if (!db) return problem(503, "Service unavailable", "Database is not configured.");
  const img = await readImage(db, id);
  if (!img) return problem(404, "Image not found", "Unknown or expired image id.");
  return new Response(new Uint8Array(img.buf), {
    status: 200,
    headers: { ...g.headers, "content-type": img.mime, "cache-control": "public, max-age=86400" },
  });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await guard(req, { scope: "write" });
  if (!g.ok) return g.response;
  const { id } = await params;
  const ok = await deleteImage(g.ctx.db, g.ctx.user.id, id);
  if (!ok) return problem(404, "Image not found", "Unknown image, or it belongs to another account.");
  return new Response(null, { status: 204, headers: g.ctx.headers });
}