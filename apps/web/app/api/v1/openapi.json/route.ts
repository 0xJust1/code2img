// GET /api/v1/openapi.json — the published contract (source: @code2img/shared/openapi).
import { openapiDocument } from "@code2img/shared";

export async function GET() {
  return Response.json(openapiDocument, {
    headers: { "cache-control": "public, max-age=3600", "access-control-allow-origin": "*" },
  });
}