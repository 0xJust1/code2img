// GET /mcp (Accept: text/html) — setup page. Same shell as the rest of the site: plain HTML,
// no client bundle; the only script is the copy button, and every snippet is a real code block.
import { siteUrl } from "@/lib/share";
import { breadcrumbs, doc, esc, footer, nav } from "../site/shell";

const ENDPOINT = `${siteUrl()}/mcp`;
// npm publication is pending: this instance serves the tarball clients install from.
const PKG = `${siteUrl()}/downloads/code2img-mcp.tgz`;

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
      "args": ["-y", "--package", "${PKG}", "code2img-mcp"],
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
      "args": ["-y", "--package", "${PKG}", "code2img-mcp"],
      "env": { "CODE2IMG_API_KEY": "YOUR_API_KEY" }
    }
  }
}`,
  },
  {
    id: "vscode",
    title: "VS Code (stdio, npx)",
    note: 'File: .vscode/mcp.json (workspace) — VS Code uses "servers" instead of "mcpServers".',
    code: `{
  "servers": {
    "code2img": {
      "command": "npx",
      "args": ["-y", "--package", "${PKG}", "code2img-mcp"],
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
      "args": ["-y", "--package", "${PKG}", "code2img-mcp"],
      "env": { "CODE2IMG_API_KEY": "YOUR_API_KEY" }
    }
  }
}`,
  },
];

const TOOLS: [string, string][] = [
  ["render_code_image", "Render a snippet → image + 30-day public URL"],
  ["list_themes", "Valid Shiki theme ids"],
  ["list_languages", "Valid language ids"],
  ["list_backgrounds", "Gradient presets and patterns"],
  ["create_share_link", "Public page with OpenGraph preview, expiring"],
  ["get_usage", "Quota left for this key"],
  ["get_share_urls", "Your recent share pages"],
];

// One copy button per snippet: the markup is a real <pre><code>, so the gate treats it as code.
const block = (s: (typeof SNIPPETS)[number]) => `<h2 data-reveal>${esc(s.title)}</h2>
<p data-reveal>${esc(s.note)}</p>
<div class="code" data-reveal><pre><code id="${s.id}">${esc(s.code)}</code></pre><button class="btn" data-copy="${s.id}">Copy</button></div>`;

const COPY_JS = `(() => {
  document.querySelectorAll("button[data-copy]").forEach((b) => b.addEventListener("click", async () => {
    var el = document.getElementById(b.dataset.copy);
    await navigator.clipboard.writeText(el.textContent);
    var old = b.textContent;
    b.textContent = "Copied";
    setTimeout(function () { b.textContent = old; }, 1200);
  }));
})();`;

export const MCP_PAGE = doc(
  {
    title: "MCP server — render code images from an agent | Code2Img",
    description:
      "Connect Code2Img to Claude, Cursor, VS Code or Windsurf: seven MCP tools to render a code image, browse themes and backgrounds, and create expiring share links.",
    path: "/mcp",
    lang: "en",
    jsonLd: [breadcrumbs([{ name: "Home", path: "/" }, { name: "MCP", path: "/mcp" }], "en")],
  },
  `${nav("en", "")}
<section class="mk-hero"><div class="mk-wrap">
<h1 data-reveal>Render code images from your agent.</h1>
<p class="mk-lead" data-reveal style="max-width:60ch">Seven MCP tools let an AI client render a code image, browse themes and backgrounds, create expiring share pages and read the remaining quota. Same API, same limits, same watermark as the REST API. The stdio package is not on npm yet: the snippets below install the tarball this instance serves.</p>
<p class="tight" data-reveal style="margin-top:var(--s5)">Endpoint <code>${esc(ENDPOINT)}</code> · Streamable HTTP · auth header <code>Authorization: Bearer YOUR_API_KEY</code> · keys in your <a href="/dashboard">dashboard</a></p>
</div></section>
<section class="mk-sec" style="padding-top:0"><div class="mk-wrap prose" data-reveal-group>
${SNIPPETS.map(block).join("\n")}
<h2 data-reveal>Tools</h2>
<table class="cmp" data-reveal><tbody>${TOOLS.map(
    ([name, desc]) => `<tr><th scope="row"><code>${esc(name)}</code></th><td>${esc(desc)}</td></tr>`,
  ).join("")}</tbody></table>
<h2 data-reveal>Notes</h2>
<p data-reveal>OAuth is planned for the remote endpoint; today it authenticates with API keys, which is what every MCP client supports. Every tool call consumes the key's quota exactly once: the server is a client of the public <a href="/api">API</a>, so there is no second rule book to keep in sync. Themes, languages and backgrounds are the same catalogs the editor uses.</p>
<p>Full REST reference: <a href="/docs">/docs</a> · machine-readable: <a href="/api/v1/openapi.json">openapi.json</a> · <a href="/llms.txt">llms.txt</a></p>
</div></section>
${footer("en")}
<script>${COPY_JS}</script>`,
);
