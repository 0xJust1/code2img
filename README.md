<p align="center">
  <img src="https://code2img.app/brand/mark.svg" width="64" height="64" alt="Code2Img mark">
</p>

<h1 align="center">&lt; &gt; Code2Img</h1>

<p align="center">
  Paste a snippet, get a PNG, JPG or PDF. One server-side render pipeline, pixel-identical to the editor.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/code2img-mcp"><img src="https://img.shields.io/npm/v/code2img-mcp.svg?label=code2img-mcp" alt="npm version"></a>
  <a href="#license"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License: MIT"></a>
  <a href="https://code2img.app"><img src="https://img.shields.io/badge/site-code2img.app-5b9dff.svg" alt="Website: code2img.app"></a>
</p>

<p align="center">
  <a href="https://code2img.app">Editor</a> ·
  <a href="https://code2img.app/docs">API docs</a> ·
  <a href="https://code2img.app/mcp">MCP setup</a> ·
  <a href="https://code2img.app/pricing">Pricing</a> ·
  <a href="https://code2img.app/llms.txt">llms.txt</a>
</p>

<p align="center">
  <img src="https://code2img.app/og.png" width="820" alt="A Code2Img card rendered from a source snippet">
</p>

## Quickstart (editor)

1. Open **https://code2img.app**.
2. Paste code, pick a language, theme and font.
3. Export PNG, JPG or PDF. Free renders carry a small watermark; Pro removes it.

No account is needed for the editor.

## API

Create an API key in the [dashboard](https://code2img.app/dashboard). The key is shown once; only its SHA-256 hash is stored.

```bash
curl -X POST https://code2img.app/api/v1/images \
  -H "authorization: Bearer $C2I_API_KEY" \
  -H "content-type: application/json" \
  -o card.png \
  -d '{"code":"console.log(1)","language":"typescript","theme":"dracula","format":"png"}'
```

- `format`: `png`, `jpg` or `pdf`. `scale`: 1–4. Default response is the binary image.
- `response_type: "url"` stores the render for 30 days and returns a public link.
- Errors are RFC 9457 `application/problem+json`. Rate-limit headers are `X-RateLimit-*`.
- Full spec: [`/api/v1/openapi.json`](https://code2img.app/api/v1/openapi.json). Catalogs: `/api/v1/themes`, `/languages`, `/fonts`, `/backgrounds`.

Quotas: Free 30/min and 500/day; Pro 300/min and 5000/day.

## MCP server

Use Code2Img from Claude Desktop, Cursor, VS Code, Windsurf or any MCP client.

```json
{
  "mcpServers": {
    "code2img": {
      "command": "npx",
      "args": ["-y", "code2img-mcp"],
      "env": { "CODE2IMG_API_KEY": "c2i_live_…" }
    }
  }
}
```

Config files: `claude_desktop_config.json`, `~/.cursor/mcp.json`, `~/.codeium/windsurf/mcp_config.json`. VS Code uses `"servers"` instead of `"mcpServers"` in `.vscode/mcp.json`.

Remote, no install (Streamable HTTP):

```bash
claude mcp add --transport http code2img https://code2img.app/mcp \
  --header "Authorization: Bearer c2i_live_…"
```

Tools: `render_code_image`, `list_themes`, `list_languages`, `list_backgrounds`, `create_share_link`, `get_usage`, `get_share_urls`.

Self-hosted instance: set `CODE2IMG_API_URL` (default `https://code2img.app/api`).

## CLI / tarball

The MCP package is also published as a tarball, if you cannot use npm:

```bash
curl -LO https://code2img.app/downloads/code2img-mcp.tgz
```

## Pricing

| Plan | Price | Includes |
|---|---|---|
| Free | 0 € | Editor, API with quotas, watermark |
| Pro | 3 € / month or 29 € / year | No watermark, higher quotas, uploads (logo / background) |

## Docs and llms.txt

- Docs: https://code2img.app/docs
- Agent-oriented summary: https://code2img.app/llms.txt

## Development

Monorepo: pnpm workspaces, TypeScript strict.

```bash
pnpm install
pnpm dev          # web :3000, render :3002
pnpm test
pnpm typecheck && pnpm lint
```

- `apps/web`: Next.js editor, dashboard, API routes, public share pages.
- `apps/render`: Fastify + Playwright Chromium render service.
- `packages/shared`: brand, config schema, themes, `buildCardHtml`, entitlements.
- `packages/db`: Drizzle schema and migrations (PostgreSQL). Optional in development.
- `packages/mcp`: `code2img-mcp` stdio and remote MCP server.
- `packages/sdk`: `@code2img/sdk` typed client.

## License

MIT. Inspired by ray.so (MIT © Raycast Technologies); this is a reimplementation with no ray.so assets or branding.
