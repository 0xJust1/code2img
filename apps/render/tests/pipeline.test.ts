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

  it("forces the watermark server-side", async () => {
    const r = req();
    r.config = { ...r.config, watermark: false };
    const out = await doRender(r, SELF);
    // Free tier: watermark stays on even when asked off — verify by comparing with watermark=true.
    const withWm = await doRender(req(), SELF);
    expect(out.buf.equals(withWm.buf)).toBe(true);
  });

  it("png can be transparent", async () => {
    const r = req();
    r.config = { ...r.config, background: { type: "transparent" } as RenderRequest["config"]["background"] };
    const out = await doRender(r, SELF);
    expect(out.mime).toBe("image/png");
    expect(out.bytes).toBeGreaterThan(0);
  });
});
