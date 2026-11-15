// GET /docs — interactive API reference (Scalar, loaded from CDN: no build step, no dep).
const HTML = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Code2Img API reference</title>
    <style>body{margin:0} .back{position:fixed;top:12px;right:16px;z-index:10;font:13px ui-sans-serif,system-ui;color:#555}</style>
  </head>
  <body>
    <a class="back" href="/">← code2img.app</a>
    <script id="api-reference" data-url="/api/v1/openapi.json"></script>
    <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
  </body>
</html>`;

export async function GET() {
  return new Response(HTML, { headers: { "content-type": "text/html; charset=utf-8" } });
}