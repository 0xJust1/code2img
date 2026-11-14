// Phase 4 delivers the full SDK (API keys, quotas, OpenAPI). This stub keeps the monorepo shape.
export interface RenderClientOptions {
  baseUrl: string; // e.g. https://code2img.app
  apiKey?: string; // Phase 4
}

export async function renderCode(
  opts: RenderClientOptions,
  body: { config: unknown; format?: "png" | "jpg" | "pdf"; scale?: 1 | 2 | 3 | 4; quality?: number },
): Promise<Blob> {
  const res = await fetch(`${opts.baseUrl}/api/render`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(opts.apiKey ? { authorization: `Bearer ${opts.apiKey}` } : {}),
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`render failed: ${res.status}`);
  return res.blob();
}
