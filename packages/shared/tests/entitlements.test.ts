import { describe, expect, it } from "vitest";
import { can, effectivePlan, maxScale, maxPresets } from "../src/entitlements";
import { cardConfigSchema } from "../src/config";

describe("entitlements", () => {
  it("free plan denies pro features and is capped at 2x", () => {
    expect(can("free", "no-watermark")).toBe(false);
    expect(can("free", "custom-logo")).toBe(false);
    expect(can("free", "custom-background")).toBe(false);
    expect(can("free", "scale-4x")).toBe(false);
    expect(maxScale("free")).toBe(2);
    expect(maxPresets("free")).toBe(10);
  });

  it("pro plan grants everything", () => {
    for (const f of ["no-watermark", "custom-logo", "custom-background", "scale-4x"] as const) {
      expect(can("pro", f)).toBe(true);
    }
    expect(maxScale("pro")).toBe(4);
    expect(maxPresets("pro")).toBe(Number.POSITIVE_INFINITY);
  });

  it("active subscription keeps pro", () => {
    const now = new Date("2026-11-15T00:00:00Z");
    expect(effectivePlan({ plan: "pro", subscriptionStatus: "active", periodEnd: new Date("2026-12-01T00:00:00Z") }, now)).toBe("pro");
    expect(effectivePlan({ plan: "pro", subscriptionStatus: "trialing" }, now)).toBe("pro");
  });

  it("past_due keeps pro only within the grace window, then downgrades", () => {
    const now = new Date("2026-11-15T00:00:00Z");
    const grace = new Date("2026-11-18T00:00:00Z");
    expect(effectivePlan({ plan: "pro", subscriptionStatus: "past_due", graceUntil: grace }, now)).toBe("pro");
    expect(effectivePlan({ plan: "pro", subscriptionStatus: "past_due", graceUntil: new Date("2026-11-14T00:00:00Z") }, now)).toBe("free");
  });

  it("canceled subscription downgrades immediately", () => {
    expect(effectivePlan({ plan: "pro", subscriptionStatus: "canceled", periodEnd: new Date(Date.now() + 86400_000) })).toBe("free");
  });
});

describe("pro config fields", () => {
  it("accepts image background and logo (Pro references)", () => {
    const cfg = cardConfigSchema.parse({
      code: "x",
      background: { type: "image", file: "abc123-00000000-0000-4000-8000-000000000000.webp" },
      logo: "abc123-00000000-0000-4000-8000-000000000000.png",
    });
    expect(cfg.background).toEqual({ type: "image", file: expect.stringMatching(/webp$/) });
    expect(cfg.logo).toBeTruthy();
  });

  it("rejects upload references with path traversal or bad extension", () => {
    expect(() => cardConfigSchema.parse({ code: "x", background: { type: "image", file: "../etc/passwd" } })).toThrow();
    expect(() => cardConfigSchema.parse({ code: "x", background: { type: "image", file: "a.html" } })).toThrow();
    expect(() => cardConfigSchema.parse({ code: "x", logo: "a.svg" })).toThrow();
  });
});
