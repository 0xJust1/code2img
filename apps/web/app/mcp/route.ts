// POST/GET/DELETE /mcp — remote MCP endpoint (Streamable HTTP, stateless).
// GET with Accept: text/html serves the human setup page instead (one segment can't hold
// both a route and a page in the App Router, and /mcp is the URL clients document).
// Auth: API key in Authorization (or x-api-key). Only the key is checked here; quotas,
// entitlements and the watermark are enforced by the API the tools call, exactly once.
import { getDb } from "@code2img/db";
import { serveMcp } from "code2img-mcp/http";
import { keyFromRaw, rawKeyFrom } from "@/lib/api/keys";
import { MCP_PAGE } from "./page-html";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function handler(req: Request): Promise<Response> {
  const db = getDb();
  const raw = rawKeyFrom(req.headers);
  const key = db && raw ? await keyFromRaw(db, raw) : null;
  if (!key) {
    // MCP clients surface this JSON as the connection error: keep the fix in the message.
    return Response.json(
      {
        jsonrpc: "2.0",
        id: null,
        error: { code: -32001, message: "Invalid API key. Create one at https://code2img.app/dashboard and send it as Authorization: Bearer <key>." },
      },
      { status: 401, headers: { "www-authenticate": 'Bearer realm="code2img"' } },
    );
  }
  return serveMcp(req, { apiKey: raw!, baseUrl: selfApiUrl() });
}

// The MCP server is a client of the public API: call ourselves over loopback, not the
// public hostname (no round trip through the LAN, no dependency on DNS).
function selfApiUrl(): string {
  return `http://127.0.0.1:${process.env.PORT ?? 3335}/api`;
}

function get(req: Request): Promise<Response> | Response {
  // Browsers ask for HTML; MCP clients open the optional SSE stream.
  if (req.headers.get("accept")?.includes("text/html")) {
    return new Response(MCP_PAGE, { headers: { "content-type": "text/html; charset=utf-8" } });
  }
  return handler(req);
}

export { handler as POST, handler as DELETE, get as GET };