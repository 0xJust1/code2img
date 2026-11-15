// The Code2Img MCP server: seven tools over the public API. The API is the trust boundary
// (quotas, entitlements, watermark), so every tool is a thin, honest HTTP call — one
// implementation shared by the hosted endpoint (/mcp) and the stdio package.
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { Api, ApiFailure } from "./client.js";

export const SERVER_INFO = { name: "code2img", version: "0.1.0" } as const;

export const SERVER_INSTRUCTIONS = `Code2Img turns source code into a shareable image (PNG/JPG).

Typical flow: call render_code_image with the snippet, then send the returned URL or the
attached image. Use list_themes, list_languages and list_backgrounds to discover valid ids
before rendering — never invent one. Use create_share_link when the user wants a public,
expiring page (image + social preview) instead of raw bytes, and get_share_urls to find
links you created earlier. get_usage reports the remaining quota when a call fails with 429.

Renders are billed against your API key quota: Free 30 requests/min and 500/day, Pro
300/min and 5000/day. Free renders carry a small code2img.app watermark.`;

// Every tool failure is one clear sentence plus the next action the model should take.
const failure = (e: unknown): { isError: true; content: { type: "text"; text: string }[] } => {
  const message =
    e instanceof ApiFailure ? `${e.message}\n\nNext step: ${e.hint}` : `Unexpected error: ${(e as Error)?.message ?? String(e)}`;
  return { isError: true, content: [{ type: "text", text: message }] };
};

// Only the fields the caller actually set: the API applies its own defaults.
function configOf(a: {
  code: string;
  language?: string;
  theme?: string;
  font?: string;
  title?: string;
  fontSize?: number;
  lineNumbers?: boolean;
  background?: string;
}) {
  const { background, ...rest } = a;
  const config: Record<string, unknown> = { ...rest };
  if (background) config.background = { type: "gradient", preset: background };
  return config;
}

const CODE = z
  .string()
  .min(1)
  .max(50_000) // keep in sync with MAX_CODE_BYTES in @code2img/shared
  .describe("The source code to render, exactly as it should appear. Keep it under 50 KB; long lines are clipped, not wrapped.");

const STYLE = {
  language: z
    .string()
    .optional()
    .describe('Shiki language id, e.g. "typescript", "python", "rust". Defaults to "auto" (detected from the code).'),
  theme: z
    .string()
    .optional()
    .describe('Shiki theme id, e.g. "github-dark", "dracula", "catppuccin-mocha". Call list_themes for the full list. Defaults to "github-dark".'),
  font: z
    .string()
    .optional()
    .describe('Monospace font id, e.g. "jetbrains-mono", "fira-code", "ibm-plex-mono". Defaults to "jetbrains-mono".'),
  title: z.string().max(120).optional().describe('Window title shown in the card header, e.g. "app.ts" or "npm install".'),
  fontSize: z.number().int().min(10).max(24).optional().describe("Code font size in px (10–24). Use 14–16 for a long snippet, 20+ for a short one."),
  lineNumbers: z.boolean().optional().describe("Show line numbers in the gutter. Defaults to true."),
  background: z
    .string()
    .optional()
    .describe('Gradient preset id behind the card, e.g. "sunset", "ocean", "midnight". Call list_backgrounds for the full list. Defaults to "sunset".'),
};

export function createMcpServer(opts: { apiKey: string; baseUrl?: string; fetch?: typeof fetch }): McpServer {
  const api = new Api(opts.apiKey, opts.baseUrl, opts.fetch);
  const server = new McpServer(SERVER_INFO, { instructions: SERVER_INSTRUCTIONS });

  server.registerTool(
    "render_code_image",
    {
      title: "Render code as an image",
      description:
        "Use when the user wants a code screenshot, a snippet image for a slide, README or social post. " +
        "Returns the image itself plus a public URL that stays valid for 30 days (safe to embed). " +
        'Example: code="npm install code2img", language="bash", theme="dracula", background="ocean". ' +
        "Unsupported theme/language ids are still rendered (the API falls back to plain text), so prefer the ids from list_themes/list_languages.",
      inputSchema: {
        code: CODE,
        ...STYLE,
        format: z.enum(["png", "jpg"]).default("png").describe("Image format. png keeps crisp text and transparency, jpg is smaller."),
        scale: z.number().int().min(1).max(4).default(2).describe("Pixel density: 1 = 1x, 2 = retina (default), 4 = Pro only (silently capped on Free)."),
      },
      annotations: { readOnlyHint: false, openWorldHint: false, idempotentHint: false },
    },
    async (args) => {
      try {
        const image = await api.json<{ id: string; url: string; format: string; bytes: number; expires_at: string }>("/v1/images", {
          config: configOf(args),
          format: args.format,
          scale: args.scale,
          response_type: "url",
        });
        const { data, mime } = await api.bytes(`/v1/images/${image.id}`);
        return {
          content: [
            { type: "image" as const, data: Buffer.from(data).toString("base64"), mimeType: mime },
            {
              type: "text" as const,
              text: `Rendered ${args.format.toUpperCase()} (${data.length} bytes).\nURL (valid until ${image.expires_at}, no auth needed): ${image.url}`,
            },
          ],
        };
      } catch (e) {
        return failure(e);
      }
    },
  );

  server.registerTool(
    "list_themes",
    {
      title: "List syntax themes",
      description:
        "Use before render_code_image when you need a valid theme id, or when the user asks which themes exist. " +
        "Returns every Shiki theme id supported by Code2Img (dark and light).",
      inputSchema: {},
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async () => {
      try {
        const { themes } = await api.json<{ themes: string[] }>("/v1/themes");
        return { content: [{ type: "text" as const, text: `${themes.length} themes: ${themes.join(", ")}` }] };
      } catch (e) {
        return failure(e);
      }
    },
  );

  server.registerTool(
    "list_languages",
    {
      title: "List languages",
      description:
        "Use before render_code_image when unsure of a language id, or when the user asks which languages are supported. " +
        'Passing "auto" (the default) lets the API detect the language from the code.',
      inputSchema: {},
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async () => {
      try {
        const { languages } = await api.json<{ languages: string[] }>("/v1/languages");
        return {
          content: [{ type: "text" as const, text: `"auto" plus ${languages.length} languages: ${languages.join(", ")}` }],
        };
      } catch (e) {
        return failure(e);
      }
    },
  );

  server.registerTool(
    "list_backgrounds",
    {
      title: "List backgrounds",
      description:
        "Use before render_code_image when you need a valid background id. Returns the gradient presets " +
        "(pass the id as `background`) and the decorative pattern names used by the editor.",
      inputSchema: {},
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async () => {
      try {
        const { gradients, patterns } = await api.json<{ gradients: { id: string; name: string }[]; patterns: string[] }>(
          "/v1/backgrounds",
        );
        return {
          content: [
            {
              type: "text" as const,
              text: `Gradients: ${gradients.map((g) => `${g.id} (${g.name})`).join(", ")}\nPatterns: ${patterns.join(", ")}`,
            },
          ],
        };
      } catch (e) {
        return failure(e);
      }
    },
  );

  server.registerTool(
    "create_share_link",
    {
      title: "Create a public share page",
      description:
        "Use when the user wants a link to send around rather than an image file: it renders the snippet, stores it " +
        "and returns a public page with an OpenGraph preview (X, LinkedIn, Slack unfurl it). Expires by default after 7 days. " +
        "The code itself is never stored — only the rendered image.",
      inputSchema: {
        code: CODE,
        ...STYLE,
        expiry: z
          .enum(["1d", "7d", "30d", "never"])
          .default("7d")
          .describe('Lifetime of the public page: "1d", "7d" (default), "30d" or "never".'),
        utm_campaign: z.string().max(40).optional().describe("Optional campaign name tagged on shared links opened from the page."),
      },
      annotations: { readOnlyHint: false, openWorldHint: false, idempotentHint: false },
    },
    async (args) => {
      try {
        const { utm_campaign, expiry, ...style } = args;
        const share = await api.json<{ slug: string; url: string; expiresAt: string | null }>("/v1/share", {
          config: configOf(style),
          expiry,
          ...(utm_campaign ? { utm: { campaign: utm_campaign } } : {}),
        });
        return {
          content: [
            {
              type: "text" as const,
              text: `Public page: ${share.url}\nExpires: ${share.expiresAt ?? "never"}\nSlug: ${share.slug}`,
            },
          ],
        };
      } catch (e) {
        return failure(e);
      }
    },
  );

  server.registerTool(
    "get_usage",
    {
      title: "Get API usage",
      description:
        "Use when a call failed with 429, or when the user asks how much quota is left. Returns the plan, today's " +
        "request and render counters, the per-minute and per-day limits, and the active key prefixes.",
      inputSchema: {},
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async () => {
      try {
        const u = await api.json<{
          plan: string;
          day: string;
          api_calls: number;
          renders: number;
          limits: { per_minute: number; per_day: number; remaining_minute: number; remaining_day: number };
        }>("/v1/usage");
        return {
          content: [
            {
              type: "text" as const,
              text:
                `Plan: ${u.plan} (${u.day})\n` +
                `Today: ${u.api_calls} requests, ${u.renders} renders\n` +
                `Quota: ${u.limits.remaining_minute}/${u.limits.per_minute} left this minute, ` +
                `${u.limits.remaining_day}/${u.limits.per_day} left today`,
            },
          ],
        };
      } catch (e) {
        return failure(e);
      }
    },
  );

  server.registerTool(
    "get_share_urls",
    {
      title: "List my share pages",
      description:
        "Use when the user asks for links created earlier, or to recover a share URL instead of rendering again. " +
        "Returns the most recent public pages with their state (active, expired, deleted).",
      inputSchema: {
        limit: z.number().int().min(1).max(50).default(10).describe("How many recent pages to return (1–50)."),
      },
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async (args) => {
      try {
        const { shares } = await api.json<{
          shares: { slug: string; url: string; state: string; expires_at: string | null; created_at: string }[];
        }>("/v1/share");
        if (!shares.length) {
          return { content: [{ type: "text" as const, text: "No share pages yet. Use create_share_link to make one." }] };
        }
        const lines = shares.slice(0, args.limit).map((s) => `${s.url} — ${s.state}, created ${s.created_at}`);
        return { content: [{ type: "text" as const, text: `${shares.length} share page(s), newest first:\n${lines.join("\n")}` }] };
      } catch (e) {
        return failure(e);
      }
    },
  );

  return server;
}