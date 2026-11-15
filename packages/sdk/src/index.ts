// @code2img/sdk — typed client for the Code2Img API (see /api/v1/openapi.json).
// Zero dependencies: fetch + Blob, works in Node 18+, Bun, Deno, browsers and workers.

export const DEFAULT_BASE_URL = "https://code2img.app/api/v1";

/** Documented paths — checked against the published OpenAPI document in tests. */
export const PATHS = {
  createImage: "/v1/images",
  getImage: "/v1/images/{id}",
  deleteImage: "/v1/images/{id}",
  themes: "/v1/themes",
  languages: "/v1/languages",
  fonts: "/v1/fonts",
  backgrounds: "/v1/backgrounds",
  usage: "/v1/usage",
  upload: "/v1/uploads",
  signedUrl: "/v1/signed-url",
  renderPng: "/v1/render.png",
} as const;

export interface Problem {
  type: string;
  title: string;
  status: number;
  detail?: string;
}

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly problem: Problem,
  ) {
    super(`${status} ${problem.title}${problem.detail ? `: ${problem.detail}` : ""}`);
    this.name = "ApiError";
  }
}

export interface RenderOptions {
  code?: string;
  language?: string;
  theme?: string;
  font?: string;
  /** Full card config — wins over the individual fields when provided. */
  config?: Record<string, unknown>;
  format?: "png" | "jpg" | "pdf";
  scale?: 1 | 2 | 3 | 4;
  quality?: number;
}

export interface StoredImage {
  id: string;
  url: string;
  format: string;
  bytes: number;
  expires_at: string;
}

export interface Usage {
  plan: "free" | "pro";
  day: string;
  api_calls: number;
  renders: number;
  limits: { per_minute: number; per_day: number; remaining_minute: number; remaining_day: number };
  keys: { prefix: string; scopes: string[]; last_used_at: string | null }[];
}

export interface SignedUrlRequest {
  code: string;
  lang?: string;
  theme?: string;
  font?: string;
  fontSize?: number;
  bg?: string;
  title?: string;
  watermark?: "0" | "1";
  b64?: boolean;
}

export interface RateLimit {
  limit: number;
  remaining: number;
  reset: number;
}

export interface Code2ImgOptions {
  apiKey: string;
  baseUrl?: string;
  fetch?: typeof globalThis.fetch;
}

export class Code2Img {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly _fetch: typeof globalThis.fetch;
  /** Rate-limit state from the last response (quotas are per key and per IP). */
  lastRateLimit: RateLimit | null = null;

  constructor(opts: Code2ImgOptions) {
    this.apiKey = opts.apiKey;
    this.baseUrl = (opts.baseUrl ?? DEFAULT_BASE_URL).replace(/\/$/, "");
    this._fetch = opts.fetch ?? globalThis.fetch.bind(globalThis);
  }

  private async request(path: string, init: RequestInit = {}): Promise<Response> {
    const res = await this._fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers: { authorization: `Bearer ${this.apiKey}`, ...(init.headers as Record<string, string> | undefined) },
    });
    this.lastRateLimit = {
      limit: Number(res.headers.get("x-ratelimit-limit") ?? 0),
      remaining: Number(res.headers.get("x-ratelimit-remaining") ?? 0),
      reset: Number(res.headers.get("x-ratelimit-reset") ?? 0),
    };
    if (!res.ok) {
      const problem = (await res.json().catch(() => ({}))) as Partial<Problem>;
      throw new ApiError(res.status, {
        type: problem.type ?? "about:blank",
        title: problem.title ?? res.statusText,
        status: res.status,
        detail: problem.detail,
      });
    }
    return res;
  }

  private async json<T>(path: string, init?: RequestInit): Promise<T> {
    return (await this.request(path, init)).json() as Promise<T>;
  }

  private async renderBody(opts: RenderOptions & { idempotencyKey?: string }, responseType: "binary" | "url") {
    const { idempotencyKey, ...rest } = opts;
    return this.request(PATHS.createImage, {
      method: "POST",
      headers: { "content-type": "application/json", ...(idempotencyKey ? { "idempotency-key": idempotencyKey } : {}) },
      body: JSON.stringify({ ...rest, response_type: responseType }),
    });
  }

  /** Render to image bytes (PNG by default). */
  async render(opts: RenderOptions & { idempotencyKey?: string }): Promise<Uint8Array> {
    return new Uint8Array(await (await this.renderBody(opts, "binary")).arrayBuffer());
  }

  /** Render, persist for 30 days, return an embeddable link. */
  async createImage(opts: RenderOptions & { idempotencyKey?: string }): Promise<StoredImage> {
    return (await this.renderBody(opts, "url")).json() as Promise<StoredImage>;
  }

  /** Stored images are public: this call does not send the key. */
  async getImage(id: string): Promise<Uint8Array> {
    const res = await this._fetch(`${this.baseUrl}/v1/images/${id}`);
    if (!res.ok) throw new ApiError(res.status, { type: "about:blank", title: res.statusText, status: res.status });
    return new Uint8Array(await res.arrayBuffer());
  }

  async deleteImage(id: string): Promise<void> {
    await this.request(PATHS.deleteImage.replace("{id}", id), { method: "DELETE" });
  }

  async themes(): Promise<string[]> {
    return (await this.json<{ themes: string[] }>(PATHS.themes)).themes;
  }

  async languages(): Promise<string[]> {
    return (await this.json<{ languages: string[] }>(PATHS.languages)).languages;
  }

  async fonts(): Promise<{ id: string; label: string; ligatures: boolean }[]> {
    return (await this.json<{ fonts: { id: string; label: string; ligatures: boolean }[] }>(PATHS.fonts)).fonts;
  }

  async backgrounds(): Promise<{ gradients: { id: string; name: string }[]; patterns: string[] }> {
    return this.json(PATHS.backgrounds);
  }

  async usage(): Promise<Usage> {
    return this.json<Usage>(PATHS.usage);
  }

  /** Pro only. */
  async upload(file: Blob, kind: "logo" | "background"): Promise<{ id: string; file: string; kind: string }> {
    const form = new FormData();
    form.set("file", file);
    form.set("kind", kind);
    return this.json(PATHS.upload, { method: "POST", body: form });
  }

  /** A stable /v1/render.png URL for one exact snippet (embeddable, no key needed at fetch time). */
  async signedUrl(opts: SignedUrlRequest): Promise<{ url: string; params: Record<string, string> }> {
    return this.json(PATHS.signedUrl, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(opts) });
  }
}

export default Code2Img;