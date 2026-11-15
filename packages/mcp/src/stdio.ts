#!/usr/bin/env node
// Stdio entry point: `npx code2img-mcp` from Claude Desktop, Cursor, VS Code, Windsurf.
// CODE2IMG_API_KEY is required; CODE2IMG_API_URL overrides the API base (self-hosted).
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { DEFAULT_API_URL } from "./client.js";
import { createMcpServer } from "./server.js";

const apiKey = process.env.CODE2IMG_API_KEY?.trim();
if (!apiKey) {
  // stdout is the MCP channel: diagnostics go to stderr only.
  console.error("code2img-mcp: set CODE2IMG_API_KEY (create one at https://code2img.app/dashboard)");
  process.exit(1);
}

const server = createMcpServer({ apiKey, baseUrl: process.env.CODE2IMG_API_URL || DEFAULT_API_URL });
await server.connect(new StdioServerTransport());
console.error(`code2img-mcp ready (API: ${process.env.CODE2IMG_API_URL || DEFAULT_API_URL})`);