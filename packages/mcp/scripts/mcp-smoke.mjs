#!/usr/bin/env node
// Live smoke: a real MCP client (Streamable HTTP) against a deployed /mcp endpoint —
// it lists the tools, renders an image, creates a share page and reads the usage.
// Usage: BASE_URL=http://192.168.1.45:3335 API_KEY=c2i_live_… node packages/mcp/scripts/mcp-smoke.mjs
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const BASE = (process.env.BASE_URL ?? "http://127.0.0.1:3335").replace(/\/$/, "");
const KEY = process.env.API_KEY;
const results = [];

function check(name, cond, extra = "") {
  results.push({ name, ok: Boolean(cond), extra: cond ? "" : String(extra) });
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${cond ? "" : ` → ${extra}`}`);
}

async function connect(key) {
  const client = new Client({ name: "code2img-smoke", version: "0.1.0" });
  const transport = new StreamableHTTPClientTransport(new URL(`${BASE}/mcp`), {
    requestInit: { headers: { authorization: `Bearer ${key}` } },
  });
  await client.connect(transport);
  return client;
}

const text = (res) => (res.content ?? []).filter((c) => c.type === "text").map((c) => c.text).join("\n");

async function main() {
  if (!KEY) {
    check("API_KEY provided", false, "set API_KEY");
    return summary();
  }

  // 0. Human page and agent map (same /mcp segment, different Accept)
  const page = await fetch(`${BASE}/mcp`, { headers: { accept: "text/html" } });
  check("/mcp serves the setup page", page.ok && (await page.text()).includes("code2img-mcp"), page.status);
  const llms = await fetch(`${BASE}/llms.txt`);
  check("/llms.txt", llms.ok && (await llms.text()).includes("/mcp"), llms.status);

  // 1. Handshake + tool list
  const client = await connect(KEY);
  const { tools } = await client.listTools();
  const names = tools.map((t) => t.name).sort();
  check("handshake + 7 tools", names.length === 7, names.join(","));
  check("tool schemas are zodsent as JSON Schema", tools.every((t) => t.inputSchema?.type === "object"), JSON.stringify(tools[0]?.inputSchema));

  // 2. Catalogs
  const themes = await client.callTool({ name: "list_themes", arguments: {} });
  check("list_themes", text(themes).includes("dracula"), text(themes).slice(0, 80));
  const langs = await client.callTool({ name: "list_languages", arguments: {} });
  check("list_languages", text(langs).includes("typescript"), text(langs).slice(0, 80));
  const bgs = await client.callTool({ name: "list_backgrounds", arguments: {} });
  check("list_backgrounds", text(bgs).includes("sunset"), text(bgs).slice(0, 80));

  // 3. Render: image block + public URL
  const render = await client.callTool({
    name: "render_code_image",
    arguments: { code: "console.log('mcp smoke')", language: "javascript", theme: "dracula", background: "ocean", scale: 2 },
  });
  const image = render.content?.[0];
  const png = image?.type === "image" ? Buffer.from(image.data, "base64") : Buffer.alloc(0);
  check("render_code_image → image content", image?.type === "image" && image.mimeType === "image/png", JSON.stringify(render).slice(0, 120));
  check("render_code_image → real PNG bytes", png.subarray(0, 4).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47])) && png.length > 1000, `${png.length} bytes`);
  const url = /https?:\/\/\S+/.exec(text(render))?.[0];
  check("render_code_image → public URL", Boolean(url), text(render));
  if (url) {
    const img = await fetch(url);
    check("returned URL serves the image without a key", img.ok && (img.headers.get("content-type") ?? "").startsWith("image/"), img.status);
  }

  // 4. Share page + listing
  const share = await client.callTool({ name: "create_share_link", arguments: { code: "npm i code2img", theme: "github-dark", expiry: "7d" } });
  const shareUrl = /https?:\/\/\S+\/i\/\S+/.exec(text(share))?.[0];
  check("create_share_link", Boolean(shareUrl), text(share));
  if (shareUrl) {
    const pageRes = await fetch(shareUrl);
    check("share page is public", pageRes.ok, pageRes.status);
  }
  const urls = await client.callTool({ name: "get_share_urls", arguments: { limit: 5 } });
  check("get_share_urls lists the new page", shareUrl ? text(urls).includes(shareUrl) : false, text(urls).slice(0, 200));

  // 5. Usage
  const usage = await client.callTool({ name: "get_usage", arguments: {} });
  check("get_usage", /Quota: \d+\/\d+ left this minute/.test(text(usage)), text(usage).slice(0, 120));

  // 6. A bad key is refused, with the fix in the message
  const refused = await connect("c2i_live_deadbeef_nope").then(
    () => false,
    (e) => String(e).includes("Invalid API key"),
  );
  check("invalid key refused with an actionable message", refused, "connected with a bogus key");

  await client.close();
  summary();
}

function summary() {
  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  if (failed.length) process.exitCode = 1;
}

await main();