// GET /docs — interactive API reference (Scalar, loaded from CDN: no build step, no dep).
// The head carries the SEO essentials (the page is in the sitemap) and a <noscript> summary
// gives crawlers that do not run JS something to index.
import { siteUrl } from "@/lib/share";

const SITE = siteUrl();
const TITLE = "API reference — Code2Img";
const DESCRIPTION =
  "Reference for the Code2Img REST API: render a code snippet to PNG, JPG or PDF, create expiring share links, and read your remaining quota. OpenAPI 3.1 spec included.";

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
    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
    <link rel="icon" href="/brand/favicon-32.png" sizes="32x32" />
    <link rel="apple-touch-icon" href="/brand/apple-touch-icon.png" />
    <style>body{margin:0} .back{position:fixed;top:12px;right:16px;z-index:10;font:13px ui-sans-serif,system-ui;color:#555} noscript{display:block;max-width:65ch;margin:0 auto;padding:var(--s6,64px) 24px;font:16px/1.5 ui-sans-serif,system-ui}</style>
  </head>
  <body>
    <a class="back" href="/">← code2img.app</a>
    <noscript><h1>Code2Img API reference</h1><p>${DESCRIPTION}</p><p><a href="/api">Endpoint overview</a> · <a href="/api/v1/openapi.json">OpenAPI 3.1 spec</a> · <a href="/mcp">MCP server</a></p></noscript>
    <script id="api-reference" data-url="/api/v1/openapi.json"></script>
    <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
  </body>
</html>`;

export async function GET() {
  return new Response(HTML, { headers: { "content-type": "text/html; charset=utf-8" } });
}
