#!/usr/bin/env node
// Live stdio smoke: runs the packaged bin exactly as a client would (`npx -y <pkg>`) and
// drives it with a real MCP client over stdio.
// Usage: CODE2IMG_API_KEY=… CODE2IMG_API_URL=… node packages/mcp/scripts/stdio-smoke.mjs [pkg]
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const pkg = process.argv[2] ?? "code2img-mcp";
const results = [];
const check = (name, cond, extra = "") => {
  results.push(Boolean(cond));
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${cond ? "" : ` → ${extra}`}`);
};

if (!process.env.CODE2IMG_API_KEY) {
  check("CODE2IMG_API_KEY provided", false, "export the key first");
  process.exit(1);
}

const client = new Client({ name: "stdio-smoke", version: "0.1.0" });
// `--package` takes either the published name or a local tarball; the bin is always code2img-mcp.
await client.connect(
  new StdioClientTransport({ command: "npx", args: ["-y", "--package", pkg, "code2img-mcp"], env: { ...process.env } }),
);

const info = client.getServerVersion();
check(`server identified (${info?.name}@${info?.version})`, info?.name === "code2img");

const { tools } = await client.listTools();
check("7 tools over stdio", tools.length === 7, tools.map((t) => t.name).join(","));

const themes = await client.callTool({ name: "list_themes", arguments: {} });
check("list_themes", (themes.content?.[0]?.text ?? "").includes("dracula"));

const render = await client.callTool({
  name: "render_code_image",
  arguments: { code: "echo 'stdio smoke'", language: "bash", theme: "github-dark" },
});
const image = render.content?.[0];
check("render_code_image returns a PNG block", image?.type === "image" && image.mimeType === "image/png");
check("PNG bytes are real", Buffer.from(image?.data ?? "", "base64").subarray(0, 4).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47])));

const hint = await client.callTool({ name: "list_languages", arguments: {} });
check("list_languages", (hint.content?.[0]?.text ?? "").includes("typescript"));

await client.close();
const failed = results.filter((ok) => !ok).length;
console.log(`\n${results.length - failed}/${results.length} checks passed`);
if (failed) process.exitCode = 1;