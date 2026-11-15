# code2img-mcp

Model Context Protocol server for [Code2Img](https://code2img.app) — turn source code into
shareable images straight from Claude Desktop, Cursor, VS Code, Windsurf or any MCP client.

Seven tools: `render_code_image`, `list_themes`, `list_languages`, `list_backgrounds`,
`create_share_link`, `get_usage`, `get_share_urls`.

## stdio (local install)

Not published on npm yet: `npx` installs the tarball served by the Code2Img instance.

```bash
CODE2IMG_API_KEY=c2i_live_… npx -y --package https://code2img.app/downloads/code2img-mcp.tgz code2img-mcp
```

Claude Desktop / Cursor / Windsurf (`claude_desktop_config.json`, `~/.cursor/mcp.json`,
`~/.codeium/windsurf/mcp_config.json`):

```json
{
  "mcpServers": {
    "code2img": {
      "command": "npx",
      "args": ["-y", "--package", "https://code2img.app/downloads/code2img-mcp.tgz", "code2img-mcp"],
      "env": { "CODE2IMG_API_KEY": "c2i_live_…" }
    }
  }
}
```

VS Code (`.vscode/mcp.json`) uses `"servers"` instead of `"mcpServers"`.

## Remote (no install)

```json
{
  "mcpServers": {
    "code2img": {
      "type": "http",
      "url": "https://code2img.app/mcp",
      "headers": { "Authorization": "Bearer c2i_live_…" }
    }
  }
}
```

```bash
claude mcp add --transport http code2img https://code2img.app/mcp \
  --header "Authorization: Bearer c2i_live_…"
```

## Environment

| Variable | Default | Notes |
|---|---|---|
| `CODE2IMG_API_KEY` | — (required) | create one at <https://code2img.app/dashboard> |
| `CODE2IMG_API_URL` | `https://code2img.app/api` | point at a self-hosted instance |

## Behaviour

- `render_code_image` returns the image **and** a public URL valid for 30 days.
- `create_share_link` renders once and returns a public page with an OpenGraph preview
  (expires after 7 days by default; the code itself is never stored).
- Every call is billed against your API key quota — Free 30/min and 500/day, Pro 300/min
  and 5000/day. Free renders carry a small code2img.app watermark.
- Errors come back as `isError` with the reason and the next action (bad key, exhausted
  quota, render timeout).

License: MIT.