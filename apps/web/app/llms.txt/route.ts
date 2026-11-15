// GET /llms.txt — the short map an LLM agent reads before calling the API or the MCP server.
import { API_LIMITS, THEMES, FONTS, LANGUAGES, gradientPresets } from "@code2img/shared";
import { siteUrl } from "@/lib/share";

export async function GET() {
  const site = siteUrl();
  const text = `# Code2Img

> Code2Img renders source code into images (PNG, JPG, PDF) or public pages with an
> OpenGraph preview. Same Playwright pipeline as the editor, one render service.

## MCP server (recommended for agents)

- Remote, Streamable HTTP: ${site}/mcp — auth: \`Authorization: Bearer <api key>\`
- stdio package (not on npm yet): \`npx -y --package ${site}/downloads/code2img-mcp.tgz code2img-mcp\` with \`CODE2IMG_API_KEY\` in the environment
- Setup snippets per client: ${site}/mcp
- Tools: render_code_image, list_themes, list_languages, list_backgrounds, create_share_link, get_usage, get_share_urls

## REST API

- Base: ${site}/api/v1 — auth: \`Authorization: Bearer <api key>\` (create keys at ${site}/dashboard)
- OpenAPI 3.1: ${site}/api/v1/openapi.json — human docs: ${site}/docs
- Render: POST /api/v1/images { code, language, theme, font, title } → image bytes, or \`response_type:"url"\` → { id, url, expires_at }
- Share page: POST /api/v1/share { code, expiry: "1d"|"7d"|"30d"|"never" } → { slug, url, expires_at }
- Catalogs (public): GET /api/v1/themes, /languages, /fonts, /backgrounds
- Errors are RFC 9457 problem details; 429 carries X-RateLimit-Limit/Remaining/Reset.
- Quotas: Free ${API_LIMITS.free.perMinute}/min and ${API_LIMITS.free.perDay}/day, Pro ${API_LIMITS.pro.perMinute}/min and ${API_LIMITS.pro.perDay}/day.

## Catalogs

- Themes (${THEMES.length}): ${THEMES.join(", ")}
- Fonts (${FONTS.length}): ${FONTS.map((f) => f.id).join(", ")}
- Languages (${LANGUAGES.length} ids, "auto" detects one): ${LANGUAGES.join(", ")}
- Background gradients (${gradientPresets.length}): ${gradientPresets.map((g) => g.id).join(", ")}

## Privacy

The code is never stored: renders keep the image and a hash of the visual config only.
Free renders carry a small code2img.app watermark; Pro removes it.
`;
  return new Response(text, {
    headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=3600" },
  });
}