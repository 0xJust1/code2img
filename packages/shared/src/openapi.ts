// OpenAPI 3.1 document for the public API. Single source: the /api/v1/openapi.json route
// serves it, the docs page (/docs) renders it, and apps/web/tests/api-contract.test.ts
// checks that every documented path is implemented by the SDK.
import { API_LIMITS } from "./entitlements";
import { MAX_CODE_BYTES } from "./config";
import { THEMES } from "./themes";

const json = (schema: Record<string, unknown>) => ({ "application/json": { schema } });
const problemResponses = {
  "400": { description: "Invalid request", content: { "application/problem+json": { schema: { $ref: "#/components/schemas/Problem" } } } },
  "401": { description: "Missing or revoked API key", content: { "application/problem+json": { schema: { $ref: "#/components/schemas/Problem" } } } },
  "403": { description: "Scope or signature refused", content: { "application/problem+json": { schema: { $ref: "#/components/schemas/Problem" } } } },
  "429": { description: "Rate limit exceeded (see X-RateLimit-* headers)", content: { "application/problem+json": { schema: { $ref: "#/components/schemas/Problem" } } } },
};

export const openapiDocument = {
  openapi: "3.1.0",
  info: {
    title: "Code2Img API",
    version: "1.0.0",
    description:
      "Render code snippets to PNG/JPG/PDF with the same Playwright pipeline as the editor. " +
      "Authenticate with an API key (`Authorization: Bearer c2i_live_…`). Free keys: " +
      `${API_LIMITS.free.perMinute}/min. Pro keys: ${API_LIMITS.pro.perMinute}/min. ` +
      "Errors are RFC 9457 problem details.",
    license: { name: "MIT" },
  },
  servers: [{ url: "https://code2img.app/api", description: "Production" }],
  security: [{ apiKey: [] }],
  tags: [
    { name: "Images" },
    { name: "Catalog" },
    { name: "Account" },
  ],
  paths: {
    "/v1/images": {
      post: {
        tags: ["Images"],
        summary: "Render a snippet",
        description:
          "Renders one card. `response_type=binary` (default) streams the image; `url` " +
          "persists it for 30 days and returns a public link. Send `Idempotency-Key` to " +
          "make retries safe: a replay with the same key and body returns the first response.",
        parameters: [{ $ref: "#/components/parameters/IdempotencyKey" }],
        requestBody: {
          required: true,
          content: json({ $ref: "#/components/schemas/RenderRequest" }),
        },
        responses: {
          "200": {
            description: "Rendered image (response_type=binary)",
            content: { "image/png": { schema: { type: "string", format: "binary" } }, "image/jpeg": { schema: { type: "string", format: "binary" } }, "application/pdf": { schema: { type: "string", format: "binary" } } },
            headers: { "X-RateLimit-Limit": { $ref: "#/components/headers/RateLimitLimit" }, "X-RateLimit-Remaining": { $ref: "#/components/headers/RateLimitRemaining" }, "X-RateLimit-Reset": { $ref: "#/components/headers/RateLimitReset" } },
          },
          "201": { description: "Stored image (response_type=url)", content: json({ $ref: "#/components/schemas/StoredImage" }) },
          ...problemResponses,
          "504": { description: "Render failed or timed out", content: { "application/problem+json": { schema: { $ref: "#/components/schemas/Problem" } } } },
        },
      },
    },
    "/v1/images/{id}": {
      get: {
        tags: ["Images"],
        summary: "Download a stored image",
        description: "Public: the uuid is the capability. Images expire after 30 days.",
        security: [],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: {
          "200": { description: "Image bytes", content: { "image/png": { schema: { type: "string", format: "binary" } } } },
          "404": { description: "Unknown or expired", content: { "application/problem+json": { schema: { $ref: "#/components/schemas/Problem" } } } },
          "429": problemResponses["429"],
        },
      },
      delete: {
        tags: ["Images"],
        summary: "Delete a stored image",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: { "204": { description: "Deleted" }, "404": problemResponses["400"], "401": problemResponses["401"] },
      },
    },
    "/v1/themes": { get: { tags: ["Catalog"], summary: "Shiki theme ids", security: [], responses: { "200": { description: "Theme ids", content: json({ type: "object", properties: { themes: { type: "array", items: { type: "string" }, examples: [THEMES[0]] } } }) }, "429": problemResponses["429"] } } },
    "/v1/languages": { get: { tags: ["Catalog"], summary: "Language ids", security: [], responses: { "200": { description: "Language ids", content: json({ type: "object", properties: { languages: { type: "array", items: { type: "string" } } } }) }, "429": problemResponses["429"] } } },
    "/v1/fonts": { get: { tags: ["Catalog"], summary: "Monospace fonts", security: [], responses: { "200": { description: "Fonts", content: json({ type: "object", properties: { fonts: { type: "array", items: { $ref: "#/components/schemas/Font" } } } }) }, "429": problemResponses["429"] } } },
    "/v1/backgrounds": { get: { tags: ["Catalog"], summary: "Gradient presets and patterns", security: [], responses: { "200": { description: "Backgrounds", content: json({ type: "object", properties: { gradients: { type: "array", items: { type: "object", properties: { id: { type: "string" }, name: { type: "string" } } } }, patterns: { type: "array", items: { type: "string" } } } }) }, "429": problemResponses["429"] } } },
    "/v1/usage": {
      get: {
        tags: ["Account"],
        summary: "Today's usage and quotas",
        responses: { "200": { description: "Usage", content: json({ $ref: "#/components/schemas/Usage" }) }, "401": problemResponses["401"] },
      },
    },
    "/v1/uploads": {
      post: {
        tags: ["Account"],
        summary: "Upload a logo or background (Pro)",
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: { type: "object", required: ["file", "kind"], properties: { file: { type: "string", format: "binary" }, kind: { type: "string", enum: ["logo", "background"] } } },
            },
          },
        },
        responses: {
          "201": { description: "Stored", content: json({ type: "object", properties: { id: { type: "string" }, file: { type: "string" }, kind: { type: "string" } } }) },
          "402": { description: "Pro plan required", content: { "application/problem+json": { schema: { $ref: "#/components/schemas/Problem" } } } },
          "413": problemResponses["400"],
          "415": problemResponses["400"],
          ...problemResponses,
        },
      },
    },
    "/v1/signed-url": {
      post: {
        tags: ["Images"],
        summary: "Mint a signed render.png URL",
        description: "Returns a stable URL for one exact snippet — safe to embed in a README, no API key needed at fetch time.",
        requestBody: { required: true, content: json({ $ref: "#/components/schemas/SignedUrlRequest" }) },
        responses: {
          "201": { description: "Signed URL", content: json({ type: "object", properties: { url: { type: "string", format: "uri" }, params: { type: "object" } } }) },
          ...problemResponses,
        },
      },
    },
    "/v1/render.png": {
      get: {
        tags: ["Images"],
        summary: "Signed render (embeddable)",
        security: [],
        parameters: [
          { name: "code", in: "query", required: true, schema: { type: "string" }, description: `Source code (max ${MAX_CODE_BYTES} bytes)` },
          { name: "sig", in: "query", required: true, schema: { type: "string" }, description: "HMAC from POST /v1/signed-url" },
          { name: "lang", in: "query", schema: { type: "string" } },
          { name: "theme", in: "query", schema: { type: "string" } },
          { name: "font", in: "query", schema: { type: "string" } },
          { name: "bg", in: "query", schema: { type: "string" }, description: "Gradient preset id" },
          { name: "b64", in: "query", schema: { type: "string", enum: ["0", "1"] }, description: "1 = code is base64url-encoded" },
        ],
        responses: {
          "200": { description: "Image", content: { "image/png": { schema: { type: "string", format: "binary" } } } },
          "403": problemResponses["403"],
          "429": problemResponses["429"],
        },
      },
    },
  },
  components: {
    securitySchemes: {
      apiKey: { type: "http", scheme: "bearer", description: "`Authorization: Bearer c2i_live_…` (or `X-API-Key`)." },
    },
    headers: {
      RateLimitLimit: { description: "Requests allowed in the current window", schema: { type: "integer" } },
      RateLimitRemaining: { description: "Requests left in the current window", schema: { type: "integer" } },
      RateLimitReset: { description: "Unix seconds when the window resets", schema: { type: "integer" } },
    },
    parameters: {
      IdempotencyKey: { name: "Idempotency-Key", in: "header", required: false, schema: { type: "string", maxLength: 200 } },
    },
    schemas: {
      Problem: {
        type: "object",
        description: "RFC 9457 problem details",
        required: ["type", "title", "status"],
        properties: {
          type: { type: "string", format: "uri" },
          title: { type: "string" },
          status: { type: "integer" },
          detail: { type: "string" },
          instance: { type: "string" },
        },
      },
      Font: { type: "object", properties: { id: { type: "string" }, label: { type: "string" }, ligatures: { type: "boolean" } } },
      RenderRequest: {
        type: "object",
        properties: {
          code: { type: "string", maxLength: MAX_CODE_BYTES, description: "Shortcut for config.code" },
          language: { type: "string", description: "Shortcut for config.language" },
          theme: { type: "string" },
          font: { type: "string" },
          config: { type: "object", additionalProperties: true, description: "Full card config (see the editor's share link format)" },
          format: { type: "string", enum: ["png", "jpg", "pdf"] },
          scale: { type: "integer", enum: [1, 2, 3, 4] },
          quality: { type: "integer", minimum: 1, maximum: 100 },
          response_type: { type: "string", enum: ["binary", "url"], default: "binary" },
        },
      },
      StoredImage: {
        type: "object",
        properties: { id: { type: "string", format: "uuid" }, url: { type: "string", format: "uri" }, format: { type: "string" }, bytes: { type: "integer" }, expires_at: { type: "string", format: "date-time" } },
      },
      SignedUrlRequest: {
        type: "object",
        required: ["code"],
        properties: {
          code: { type: "string" },
          lang: { type: "string" },
          theme: { type: "string" },
          font: { type: "string" },
          fontSize: { type: "integer" },
          bg: { type: "string" },
          title: { type: "string" },
          watermark: { type: "string", enum: ["0", "1"] },
          b64: { type: "boolean", description: "Base64url-encode code in the query string" },
        },
      },
      Usage: {
        type: "object",
        properties: {
          plan: { type: "string", enum: ["free", "pro"] },
          day: { type: "string", format: "date" },
          api_calls: { type: "integer" },
          renders: { type: "integer" },
          limits: { type: "object", properties: { per_minute: { type: "integer" }, per_day: { type: "integer" }, remaining_minute: { type: "integer" }, remaining_day: { type: "integer" } } },
          keys: { type: "array", items: { type: "object", properties: { prefix: { type: "string" }, scopes: { type: "array", items: { type: "string" } }, last_used_at: { type: "string", format: "date-time" } } } },
        },
      },
    },
  },
} as const;

export type OpenApiDocument = typeof openapiDocument;