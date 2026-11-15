// Thin HTTP client for the Code2Img API. Written here rather than importing @code2img/sdk
// so the published npm package has no workspace dependency.

export const DEFAULT_API_URL = "https://code2img.app/api";

export interface Problem {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
}

/** Any non-2xx answer, with the next action spelled out for the calling LLM. */
export class ApiFailure extends Error {
  constructor(
    readonly status: number,
    readonly problem: Problem,
  ) {
    super(`Code2Img API ${status}: ${problem.title ?? "request failed"}${problem.detail ? ` — ${problem.detail}` : ""}`);
    this.name = "ApiFailure";
  }

  get hint(): string {
    switch (this.status) {
      case 401:
        return "The API key is missing, revoked or wrong. Create one at https://code2img.app/dashboard and pass it as CODE2IMG_API_KEY (stdio) or Authorization: Bearer <key> (remote).";
      case 403:
        return "This key lacks the scope for that call. Create a key with the write scope.";
      case 429:
        return "Quota exhausted for this minute or day. Wait and retry; upgrade to Pro for higher limits (https://code2img.app/pricing).";
      case 504:
        return "The render service timed out — shorten the snippet or retry once.";
      default:
        return this.problem.detail ? "Fix the arguments and retry." : "Retry once, then report the failure.";
    }
  }
}

export class Api {
  private readonly base: string;

  constructor(
    private readonly apiKey: string,
    baseUrl: string = DEFAULT_API_URL,
    private readonly fetchImpl: typeof fetch = fetch,
  ) {
    this.base = baseUrl.replace(/\/$/, "");
  }

  private async request(path: string, init: RequestInit = {}): Promise<Response> {
    const res = await this.fetchImpl(`${this.base}${path}`, {
      ...init,
      headers: {
        authorization: `Bearer ${this.apiKey}`,
        ...(init.body instanceof FormData ? {} : { "content-type": "application/json" }),
        ...(init.headers as Record<string, string> | undefined),
      },
    });
    if (!res.ok) {
      const problem = (await res.json().catch(() => ({}))) as Problem;
      throw new ApiFailure(res.status, problem);
    }
    return res;
  }

  json<T>(path: string, body?: unknown): Promise<T> {
    return this.request(path, body === undefined ? {} : { method: "POST", body: JSON.stringify(body) }).then(
      (r) => r.json() as Promise<T>,
    );
  }

  bytes(path: string): Promise<{ data: Uint8Array; mime: string }> {
    return this.request(path).then(async (r) => ({
      data: new Uint8Array(await r.arrayBuffer()),
      mime: r.headers.get("content-type")?.split(";")[0] ?? "image/png",
    }));
  }
}