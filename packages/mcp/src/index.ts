// Code2Img MCP server: one implementation, two transports — `./http` for the hosted
// endpoint (apps/web mounts it at /mcp) and the `code2img-mcp` bin for stdio.
export { createMcpServer, SERVER_INFO, SERVER_INSTRUCTIONS } from "./server.js";
export { Api, ApiFailure, DEFAULT_API_URL } from "./client.js";