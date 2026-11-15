// GET /api/og?title=…&sub=…&theme=… — a dynamic Open Graph card, rendered by the product's own
// render service (so it is the same card a user gets, watermark included on the free plan).
import { THEMES } from "@code2img/shared";
import { renderCard } from "@/lib/render";
import { esc } from "../../site/shell";

const MAX = 96;

function clean(raw: string | null, fallback = ""): string {
  if (!raw) return fallback;
  // control characters and zero-width noise would let a caller break the card layout
  const s = [...raw]
    .map((c) => (c.charCodeAt(0) < 32 || c.charCodeAt(0) === 127 || (c.charCodeAt(0) >= 0x200b && c.charCodeAt(0) <= 0x200f) ? " " : c))
    .join("")
    .trim();
  return s.length > MAX ? `${s.slice(0, MAX - 1)}…` : s;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const title = clean(url.searchParams.get("title"), "Code2Img");
  const sub = clean(url.searchParams.get("sub"), "code2img.app");
  const asked = url.searchParams.get("theme") ?? "tokyo-night";
  const theme = (THEMES as readonly string[]).includes(asked) ? asked : "tokyo-night";

  const res = await renderCard(
    req,
    {
      config: {
        code: title,
        language: "text",
        theme,
        title: sub,
        ratio: "og",
        fontSize: 24,
        lineNumbers: false,
        padding: 56,
        background: { type: "gradient", preset: "midnight" },
      },
      format: "png",
      scale: 1,
    },
    { history: false, user: null },
  );

  if (!res.ok) {
    // a broken OG tag is worse than a generic one: fall back to the static image
    return Response.redirect(new URL("/og.png", url), 302);
  }
  return new Response(res.body, {
    headers: {
      "content-type": "image/png",
      "cache-control": "public, max-age=86400, stale-while-revalidate=604800",
      "x-og-title": esc(title),
    },
  });
}
