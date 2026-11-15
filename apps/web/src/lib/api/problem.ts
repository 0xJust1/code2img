// RFC 9457 problem details: every /api/v1 error is application/problem+json.
// One place so the shape can never drift between endpoints.
const BASE = process.env.APP_URL ?? "https://code2img.app";

export interface ProblemBody {
  type: string;
  title: string;
  status: number;
  detail?: string;
  instance?: string;
  [k: string]: unknown;
}

export function problem(status: number, title: string, detail?: string, extra: Record<string, unknown> = {}): Response {
  const body: ProblemBody = {
    type: `${BASE}/problems/${slug(title)}`,
    title,
    status,
    ...(detail ? { detail } : {}),
    ...extra,
  };
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/problem+json", "cache-control": "no-store" },
  });
}

function slug(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

/** Same problem, but carrying rate-limit headers (429). */
export function problemWithHeaders(status: number, title: string, detail: string, headers: Record<string, string>, extra: Record<string, unknown> = {}): Response {
  const res = problem(status, title, detail, extra);
  for (const [k, v] of Object.entries(headers)) res.headers.set(k, v);
  return res;
}