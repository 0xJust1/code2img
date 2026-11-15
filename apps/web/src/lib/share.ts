// Share-link rules: expiry, public URLs, UTM tracking. Pure functions (no IO) so the
// page, the image route and the tests agree on one definition.
import { randomBytes } from "node:crypto";
import { APP_URL } from "@code2img/shared";

export const SHARE_EXPIRY = ["1d", "7d", "30d", "never"] as const;
export type ShareExpiry = (typeof SHARE_EXPIRY)[number];

const EXPIRY_DAYS: Record<ShareExpiry, number | null> = { "1d": 1, "7d": 7, "30d": 30, never: null };

/** Unknown/missing expiry falls back to 7 days — never to "forever". */
export function expiryFrom(expiry: string | undefined | null, now: Date = new Date()): Date | null {
  // "never" maps to null on purpose — a missing/unknown value must not inherit it.
  const known = typeof expiry === "string" && Object.hasOwn(EXPIRY_DAYS, expiry);
  const days = known ? EXPIRY_DAYS[expiry as ShareExpiry] : EXPIRY_DAYS["7d"];
  return days === null ? null : new Date(now.getTime() + days * 86_400_000);
}

export function newSlug(): string {
  return randomBytes(8).toString("base64url");
}

export type ShareState = "active" | "expired" | "deleted";

export function shareState(
  link: { expiresAt: Date | null; deletedAt: Date | null },
  now: Date = new Date(),
): ShareState {
  if (link.deletedAt) return "deleted";
  if (link.expiresAt && link.expiresAt <= now) return "expired";
  return "active";
}

/** Public base URL: the deployed origin when configured (APP_URL), brand domain otherwise. */
export function siteUrl(): string {
  return (process.env.APP_URL ?? APP_URL).replace(/\/+$/, "");
}

export function publicUrl(slug: string): string {
  return `${siteUrl()}/i/${slug}`;
}

export function shareImageUrl(slug: string): string {
  return `${publicUrl(slug)}/image`;
}

/** UTM values reach a URL: keep them short and charset-safe. */
export function cleanUtm(input: unknown): Record<string, string> | null {
  if (typeof input !== "object" || input === null) return null;
  const out: Record<string, string> = {};
  for (const key of ["source", "medium", "campaign"] as const) {
    const v = (input as Record<string, unknown>)[key];
    if (typeof v === "string" && v.trim()) out[key] = v.trim().slice(0, 40).replace(/\s+/g, "-").replace(/[^\w.-]/g, "");
  }
  return Object.keys(out).length ? out : null;
}

// The network itself is always utm_source (real referrer beats a stored value);
// medium/campaign stay owner-configurable.
export function trackedUrl(slug: string, source: string, utm: Record<string, string> | null): string {
  const q = new URLSearchParams({ utm_source: source, utm_medium: utm?.medium || "social" });
  if (utm?.campaign) q.set("utm_campaign", utm.campaign);
  return `${publicUrl(slug)}?${q.toString()}`;
}