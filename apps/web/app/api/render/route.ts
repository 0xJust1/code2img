// Authenticated render proxy: entitlements live in @/lib/render (shared with /api/share).
import { renderCard } from "@/lib/render";

export async function POST(req: Request) {
  let body: { config?: unknown; format?: string; scale?: number; quality?: number; anim?: { type: "typewriter"; durationMs: number } };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "invalid body" }, { status: 400 });
  }
  return renderCard(req, body, { history: true });
}