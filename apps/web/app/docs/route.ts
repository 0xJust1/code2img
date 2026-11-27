// GET /docs — interactive API reference (Scalar, loaded from CDN: no build step, no dep).
// The head carries the SEO essentials (the page is in the sitemap) and a server-rendered summary
// sits above the Scalar widget: crawlers that do not run JS get the real API surface (endpoint,
// formats, quotas) instead of an empty body (audit `near_empty_content`, `structured_data_missing`).
import { API_LIMITS } from "@code2img/shared";
import { siteUrl } from "@/lib/share";

const SITE = siteUrl();
const TITLE = "API reference — Code2Img";
const DESCRIPTION =
  "Reference for the Code2Img REST API: render a code snippet to PNG, JPG or PDF, create expiring share links, and read your remaining quota. OpenAPI 3.1 spec included.";

const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "TechArticle",
  headline: TITLE,
  description: DESCRIPTION,
  url: `${SITE}/docs`,
  inLanguage: "en",
  author: { "@type": "Organization", name: "Code2Img", url: SITE },
  publisher: { "@type": "Organization", name: "Code2Img", logo: { "@type": "ImageObject", url: `${SITE}/brand/icon-512.png` } },
};

const HTML = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${TITLE}</title>
    <meta name="description" content="${DESCRIPTION}" />
    <link rel="canonical" href="${SITE}/docs" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="Code2Img" />
    <meta property="og:title" content="${TITLE}" />
    <meta property="og:description" content="${DESCRIPTION}" />
    <meta property="og:url" content="${SITE}/docs" />
    <meta property="og:image" content="${SITE}/og.png" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:image" content="${SITE}/og.png" />
    <link rel="icon" href="/favicon.svg?v=2" type="image/svg+xml" />
    <link rel="icon" href="/favicon.ico?v=2" sizes="any" />
    <link rel="icon" href="/brand/favicon-32.png?v=2" sizes="32x32" type="image/png" />
    <link rel="apple-touch-icon" href="/brand/apple-touch-icon.png?v=2" sizes="180x180" />
    <style>body{margin:0} .back{position:fixed;top:12px;right:16px;z-index:10;font:13px ui-sans-serif,system-ui;color:#555} .api-intro{max-width:65ch;margin:0 auto;padding:64px 24px 8px;font:16px/1.55 ui-sans-serif,system-ui;color:#1b1b1b} .api-intro h1{font-size:1.7rem;margin:0 0 .4em} .api-intro h2{font-size:1.05rem;margin:1.4em 0 .3em} .api-intro p{margin:.3em 0} .api-intro code{font:0.92em ui-monospace,SFMono-Regular,Menlo,monospace;background:#f2f2f2;padding:.1em .3em;border-radius:4px} .api-intro ul{margin:.3em 0;padding-left:1.2em} .api-intro a{color:#0b62d6}</style>
    <script type="application/ld+json">${JSON.stringify(JSON_LD)}</script>
  </head>
  <body>
    <a class="back" href="/">← code2img.app</a>
    <main class="api-intro" id="api-summary">
      <h1>Code2Img API reference</h1>
      <p>${DESCRIPTION}</p>
      <h2>Render an image</h2>
      <p><code>POST /api/v1/images</code> with a JSON <code>config</code> — <code>{ code, language, theme, font, title }</code> — returns the image bytes. Send <code>response_type: "url"</code> instead to receive a temporary share URL — <code>{ id, url, expires_at }</code>.</p>
      <h2>Formats</h2>
      <p>PNG, JPG and PDF, at up to 2× on the Free plan and 4× on Pro. Free renders carry a small code2img.app watermark; Pro removes it.</p>
      <h2>Quotas</h2>
      <ul>
        <li>Free: ${API_LIMITS.free.perMinute} requests/min and ${API_LIMITS.free.perDay}/day.</li>
        <li>Pro: ${API_LIMITS.pro.perMinute} requests/min and ${API_LIMITS.pro.perDay}/day.</li>
      </ul>
      <h2>Other endpoints</h2>
      <ul>
        <li><code>POST /api/v1/share</code> — expiring public share page — <code>{ code, expiry: "1d" | "7d" | "30d" | "never" }</code>.</li>
        <li><code>GET /api/v1/themes</code>, <code>/languages</code>, <code>/fonts</code>, <code>/backgrounds</code> — public catalogs.</li>
      </ul>
      <p>Requests authenticate with <code>Authorization: Bearer &lt;API_KEY&gt;</code> (create keys in the <a href="/dashboard">dashboard</a>). Errors use RFC 9457 problem details; a 429 carries <code>X-RateLimit-Limit/Remaining/Reset</code>.</p>
      <p><a href="/api">Endpoint overview</a> · <a href="/api/v1/openapi.json">OpenAPI 3.1 spec</a> · <a href="/mcp">MCP server</a></p>
    </main>
    <script id="api-reference" data-url="/api/v1/openapi.json"></script>
    <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
  </body>
</html>`;

export async function GET() {
  return new Response(HTML, { headers: { "content-type": "text/html; charset=utf-8" } });
}
