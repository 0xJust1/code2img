// Remote transport: Web-standard Streamable HTTP, stateless (one server per request, no
// session state to keep). Mounted by apps/web at POST/GET/DELETE /mcp.
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { createMcpServer } from "./server.js";

export async function serveMcp(
  req: Request,
  opts: { apiKey: string; baseUrl?: string; fetch?: typeof fetch },
): Promise<Response> {
  const server = createMcpServer(opts);
  // Stateless: no session id, no resumability — every MCP message carries its own auth.
  const transport = new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
  await server.connect(transport);
  const res = await transport.handleRequest(req);
  await server.close();
  return res;
}