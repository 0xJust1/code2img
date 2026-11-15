import { beforeAll, describe, expect, it } from "vitest";
import { cacheClear } from "../src/cache.js";
import { doRender, parseRenderBody, requestKey, type RenderRequest } from "../src/pipeline.js";

const SELF = "http://127.0.0.1:0"; // origin placeholder; fonts route is not exercised here

beforeAll(() => cacheClear());

function req(over: Partial<RenderRequest> = {}): RenderRequest {
  return {
    config: { code: "console.log('hi');", language: "auto", theme: "github-dark", watermark: true } as RenderRequest["config"],
    format: "png",
    scale: 1,
    quality: 90,
    ...over,
  };
}

describe("parseRenderBody", () => {
  it("applies safe defaults and clamps scale/quality", () => {
    const r = parseRenderBody({ config: { code: "x" }, scale: 99, quality: 5000 });
    expect(r.scale).toBe(2);
    expect(r.format).toBe("png");
  });

  it("rejects oversized code", () => {
    expect(() => parseRenderBody({ config: { code: "x".repeat(50_001) } })).toThrow();
  });
});

describe("cache", () => {
  it("same request hits the cache (identical bytes, second call fast)", async () => {
    const r = req();
    const first = await doRender(r, SELF);
    const second = await doRender(r, SELF);
    expect(first.buf.equals(second.buf)).toBe(true);
    expect(requestKey(r)).toBe(requestKey(req()));
    expect(requestKey(r)).not.toBe(requestKey(req({ format: "jpg" })));
  });

  it("different scale yields different bytes", async () => {
    const a = await doRender(req({ scale: 1 }), SELF);
    const b = await doRender(req({ scale: 2 }), SELF);
    expect(a.buf.length).not.toBe(b.buf.length);
  });

  it("renders jpg and pdf", async () => {
    const jpg = await doRender(req({ format: "jpg", quality: 80 }), SELF);
    expect(jpg.mime).toBe("image/jpeg");
    const pdf = await doRender(req({ format: "pdf" }), SELF);
    expect(pdf.buf.subarray(0, 4).toString()).toBe("%PDF");
  });

  it("forces the watermark server-side for untrusted requests", async () => {
    // Untrusted path (no internal token): watermark:false is stripped before render.
    const parsed = parseRenderBody({ config: { code: "x", watermark: false } });
    expect(parsed.config.watermark).toBe(true);
  });

  it("clamps scale to 2 for untrusted requests", () => {
    const parsed = parseRenderBody({ config: { code: "x" }, scale: 4 });
    expect(parsed.scale).toBe(2);
  });

  it("drops uploaded assets for untrusted requests", () => {
    const parsed = parseRenderBody({
      config: { code: "x", background: { type: "image", file: "a.webp" }, logo: "a.png" },
    });
    expect(parsed.config.logo).toBeUndefined();
    expect(parsed.config.background.type).toBe("solid");
  });

  it("trusts requests carrying attachments (Pro path)", () => {
    const parsed = parseRenderBody(
      { config: { code: "x", watermark: false, logo: "a.png" }, scale: 4, attachments: { "a.png": "data:image/png;base64,x" } },
      true,
    );
    expect(parsed.config.watermark).toBe(false);
    expect(parsed.scale).toBe(4);
    expect(parsed.attachments?.["a.png"]).toContain("data:image/png");
  });

  it("png can be transparent", async () => {
    const r = req();
    r.config = { ...r.config, background: { type: "transparent" } as RenderRequest["config"]["background"] };
    const out = await doRender(r, SELF);
    expect(out.mime).toBe("image/png");
    expect(out.bytes).toBeGreaterThan(0);
  });

  it("caps animation duration to 5 s for untrusted requests", () => {
    const parsed = parseRenderBody({ config: { code: "x" }, format: "webm", anim: { type: "typewriter", durationMs: 8000 } });
    expect(parsed.anim?.durationMs).toBe(5000);
    expect(parsed.format).toBe("webm");
  });

  it("downgrades mp4 to webm for untrusted requests", () => {
    const parsed = parseRenderBody({ config: { code: "x" }, format: "mp4", anim: { type: "typewriter", durationMs: 3000 } });
    expect(parsed.format).toBe("webm");
  });

  it("forces watermark on animated exports for untrusted requests", () => {
    const parsed = parseRenderBody({ config: { code: "x", watermark: false }, format: "webm", anim: { type: "typewriter", durationMs: 3000 } });
    expect(parsed.config.watermark).toBe(true);
  });

  it("includes anim in cache key", () => {
    const a = requestKey(req({ format: "webm", anim: { type: "typewriter", durationMs: 3000 } }));
    const b = requestKey(req({ format: "webm", anim: { type: "typewriter", durationMs: 4000 } }));
    expect(a).not.toBe(b);
  });

  it("renders a WebM video with typewriter animation", async () => {
    const out = await doRender(req({ format: "webm", anim: { type: "typewriter", durationMs: 1000 } }), SELF);
    expect(out.mime).toBe("video/webm");
    expect(out.ext).toBe("webm");
    expect(out.bytes).toBeGreaterThan(0);
    // WebM magic bytes: 1A 45 DF A3
    expect(out.buf.subarray(0, 4).toString("hex")).toBe("1a45dfa3");
  });
});
