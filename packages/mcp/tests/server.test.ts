// The MCP server end-to-end over the in-memory transport: a real MCP client talks to a
// real server, with the Code2Img API faked at the fetch boundary.
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { describe, expect, it } from "vitest";
import { createMcpServer } from "../src/server.js";

const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3]);
const json = (body: unknown, status = 200) => Response.json(body, { status });

function fakeApi(fail?: { status: number; title: string; detail?: string }) {
  const seen: { url: string; body?: unknown }[] = [];
  const fetchImpl = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const body = typeof init?.body === "string" ? JSON.parse(init.body) : undefined;
    seen.push({ url, body });
    if (fail) return json({ type: "about:blank", ...fail }, fail.status);
    if (url.endsWith("/v1/themes")) return json({ themes: ["github-dark", "dracula"] });
    if (url.includes("/v1/images/")) return new Response(PNG, { headers: { "content-type": "image/png" } });
    if (url.endsWith("/v1/images")) {
      return json({ id: "11111111-1111-1111-1111-111111111111", url: "https://code2img.app/api/v1/images/1", format: "png", bytes: 3, expires_at: "2026-12-15T00:00:00.000Z" }, 201);
    }
    return json({});
  }) as typeof fetch;
  return { fetchImpl, seen };
}

async function connect(fetchImpl: typeof fetch) {
  const server = createMcpServer({ apiKey: "c2i_live_test_key", baseUrl: "https://api.test/api", fetch: fetchImpl });
  const [clientSide, serverSide] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: "test", version: "0.0.0" });
  await Promise.all([server.connect(serverSide), client.connect(clientSide)]);
  return { client, server };
}

describe("code2img MCP server", () => {
  it("exposes the seven documented tools", async () => {
    const { client } = await connect(fakeApi().fetchImpl);
    const { tools } = await client.listTools();
    expect(tools.map((t) => t.name).sort()).toEqual([
      "create_share_link",
      "get_share_urls",
      "get_usage",
      "list_backgrounds",
      "list_languages",
      "list_themes",
      "render_code_image",
    ]);
    // Descriptions are the LLM's only documentation: they must say when to use the tool.
    for (const t of tools) expect(t.description ?? "").toContain("Use ");
  });

  it("renders an image and returns both the pixels and the public URL", async () => {
    const { fetchImpl, seen } = fakeApi();
    const { client } = await connect(fetchImpl);
    const res = await client.callTool({
      name: "render_code_image",
      arguments: { code: "console.log(1)", theme: "dracula", background: "ocean", format: "png", scale: 2 },
    });
    const [image, text] = res.content as { type: string; data?: string; mimeType?: string; text?: string }[];
    expect(image).toMatchObject({ type: "image", mimeType: "image/png", data: Buffer.from(PNG).toString("base64") });
    expect(text?.text).toContain("https://code2img.app/api/v1/images/1");
    // The tool speaks the public API: auth header, config passthrough, url response type.
    expect(seen[0]?.body).toMatchObject({ config: { code: "console.log(1)", theme: "dracula", background: { type: "gradient", preset: "ocean" } }, response_type: "url" });
  });

  it("lists themes", async () => {
    const { client } = await connect(fakeApi().fetchImpl);
    const res = await client.callTool({ name: "list_themes", arguments: {} });
    expect((res.content as { text: string }[])[0]?.text).toContain("dracula");
  });

  it("turns an API 401 into an actionable error", async () => {
    const { client } = await connect(fakeApi({ status: 401, title: "Invalid API key", detail: "The key is unknown." }).fetchImpl);
    const res = await client.callTool({ name: "get_usage", arguments: {} });
    expect(res.isError).toBe(true);
    expect((res.content as { text: string }[])[0]?.text).toContain("Next step: The API key is missing, revoked or wrong.");
  });
});