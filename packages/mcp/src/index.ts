// Phase 5 delivers the MCP server (remote /mcp + npm stdio, 7 tools). Stub keeps the monorepo shape.
import { APP_NAME, APP_URL } from "@code2img/shared";

export function mcpServerInfo() {
  return { name: APP_NAME.toLowerCase(), url: `${APP_URL}/mcp`, planned: "Phase 5" };
}
