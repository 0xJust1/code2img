// GET /mcp (Accept: text/html) — setup page. Plain HTML like /docs: no build step, no
// client bundle; the only script is the copy button.
import { siteUrl } from "@/lib/share";

const ENDPOINT = `${siteUrl()}/mcp`;

const SNIPPETS: { id: string; title: string; note: string; code: string }[] = [
  {
    id: "remote",
    title: "Remote (no install) — any client that speaks Streamable HTTP",
    note: "Claude Code, Cursor, Windsurf and VS Code accept a URL plus headers.",
    code: `{
  "mcpServers": {
    "code2img": {
      "type": "http",
      "url": "${ENDPOINT}",
      "headers": { "Authorization": "Bearer YOUR_API_KEY" }
    }
  }
}`,
  },
  {
    id: "claude-code",
    title: "Claude Code (CLI)",
    note: "One command, remote transport.",
    code: `claude mcp add --transport http code2img ${ENDPOINT} \\
  --header "Authorization: Bearer YOUR_API_KEY"`,
  },
  {
    id: "claude-desktop",
    title: "Claude Desktop (stdio, npx)",
    note: "File: ~/Library/Application Support/Claude/claude_desktop_config.json (macOS) or %APPDATA%\\Claude\\claude_desktop_config.json (Windows).",
    code: `{
  "mcpServers": {
    "code2img": {
      "command": "npx",
      "args": ["-y", "code2img-mcp"],
      "env": { "CODE2IMG_API_KEY": "YOUR_API_KEY" }
    }
  }
}`,
  },
  {
    id: "cursor",
    title: "Cursor (stdio, npx)",
    note: "File: ~/.cursor/mcp.json",
    code: `{
  "mcpServers": {
    "code2img": {
      "command": "npx",
      "args": ["-y", "code2img-mcp"],
      "env": { "CODE2IMG_API_KEY": "YOUR_API_KEY" }
    }
  }
}`,
  },
  {
    id: "vscode",
    title: "VS Code (stdio, npx)",
    note: "File: .vscode/mcp.json (workspace) — VS Code uses \"servers\" instead of \"mcpServers\".",
    code: `{
  "servers": {
    "code2img": {
      "command": "npx",
      "args": ["-y", "code2img-mcp"],
      "env": { "CODE2IMG_API_KEY": "YOUR_API_KEY" }
    }
  }
}`,
  },
  {
    id: "windsurf",
    title: "Windsurf (stdio, npx)",
    note: "File: ~/.codeium/windsurf/mcp_config.json",
    code: `{
  "mcpServers": {
    "code2img": {
      "command": "npx",
      "args": ["-y", "code2img-mcp"],
      "env": { "CODE2IMG_API_KEY": "YOUR_API_KEY" }
    }
  }
}`,
  },
];

const TOOLS = [
  ["render_code_image", "Render a snippet → image + 30-day public URL"],
  ["list_themes", "Valid Shiki theme ids"],
  ["list_languages", "Valid language ids"],
  ["list_backgrounds", "Gradient presets and patterns"],
  ["create_share_link", "Public page with OpenGraph preview, expiring"],
  ["get_usage", "Quota left for this key"],
  ["get_share_urls", "Your recent share pages"],
];

const block = (s: (typeof SNIPPETS)[number]) => `
  <section>
    <h2>${s.title}</h2>
    <p class="note">${s.note}</p>
    <div class="code"><pre id="${s.id}">${s.code.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</pre><button data-copy="${s.id}">Copy</button></div>
  </section>`;

export const MCP_PAGE = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Code2Img MCP server — render code images from your AI client</title>
<meta name="description" content="Connect Code2Img to Claude, Cursor, VS Code or Windsurf: seven MCP tools to render code screenshots, list themes and create share links.">
<style>
  :root { --bg:#0e0e13; --panel:#17171f; --border:#2b2b38; --text:#e9e9f0; --muted:#a0a0b2; --accent:#7c6cff; }
  * { box-sizing:border-box }
  body { margin:0; background:var(--bg); color:var(--text); font:14px/1.55 ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif }
  main { max-width:860px; margin:0 auto; padding:40px 20px 80px }
  h1 { font-size:28px; margin:0 0 6px }
  h2 { font-size:15px; margin:0 0 4px }
  a { color:var(--accent) }
  .lead { color:var(--muted); margin:0 0 24px }
  .endpoint { display:flex; gap:10px; align-items:center; flex-wrap:wrap; background:var(--panel); border:1px solid var(--border); border-radius:8px; padding:12px 14px; margin-bottom:28px }
  .endpoint code { font:13px ui-monospace,monospace }
  .endpoint span { color:var(--muted); font-size:12px }
  section { background:var(--panel); border:1px solid var(--border); border-radius:8px; padding:14px 16px; margin-bottom:14px }
  .note { color:var(--muted); font-size:12px; margin:0 0 10px }
  .code { position:relative }
  pre { margin:0; background:var(--bg); border:1px solid var(--border); border-radius:6px; padding:12px; overflow-x:auto; font:12.5px/1.5 ui-monospace,"JetBrains Mono",monospace }
  button { position:absolute; top:8px; right:8px; background:var(--panel); color:var(--text); border:1px solid var(--border); border-radius:6px; padding:4px 10px; font-size:12px; cursor:pointer }
  button:hover { border-color:var(--accent) }
  table { width:100%; border-collapse:collapse; margin-top:8px }
  td { padding:6px 0; border-top:1px solid var(--border); vertical-align:top }
  td:first-child { width:200px; font:12.5px ui-monospace,monospace; color:var(--accent) }
  .foot { color:var(--muted); font-size:12px; margin-top:24px }
</style>
</head>
<body><main>
  <h1>Code2Img MCP server</h1>
  <p class="lead">Seven tools that let an AI client render code screenshots, browse themes and backgrounds, create expiring share
  pages and read the remaining quota. Same API, same limits, same watermark as the REST API.</p>

  <div class="endpoint">
      <code>${ENDPOINT}</code>
      <span>Streamable HTTP · auth header: <code>Authorization: Bearer YOUR_API_KEY</code> · keys in your <a href="/dashboard">dashboard</a></span>
    </div>

  ${SNIPPETS.map(block).join("\n")}

  <section>
    <h2>Tools</h2>
    <table>${TOOLS.map(([name, desc]) => `<tr><td>${name}</td><td>${desc}</td></tr>`).join("")}</table>
  </section>

  <p class="foot">OAuth is planned for the remote endpoint; today it authenticates with API keys, which is what every MCP client
  supports. Full REST reference: <a href="/docs">/docs</a> · machine-readable: <a href="/api/v1/openapi.json">openapi.json</a> · <a href="/llms.txt">llms.txt</a></p>
</main>
<script>
  document.querySelectorAll("button[data-copy]").forEach((b) => b.addEventListener("click", async () => {
    const el = document.getElementById(b.dataset.copy);
    await navigator.clipboard.writeText(el.textContent);
    const old = b.textContent;
    b.textContent = "Copied";
    setTimeout(() => { b.textContent = old; }, 1200);
  }));
</script>
</body></html>`;