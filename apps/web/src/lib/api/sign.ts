// Signed render URLs: GET /api/v1/render.png is open to the world (embeddable badge),
// so every parameter is bound by an HMAC. No expiry on purpose — a README badge must
// keep working — the signature pins one exact snippet, which is what stops open abuse.
import { createHmac, timingSafeEqual } from "node:crypto";

export const SIGNED_PARAMS = ["code", "lang", "theme", "font", "fontSize", "bg", "title", "watermark"] as const;

export type SignedParams = Partial<Record<(typeof SIGNED_PARAMS)[number], string>>;

/** Allowlisted params, defaults applied, stable order — the signed string. */
export function canonical(params: SignedParams): Record<string, string> {
  const out: Record<string, string> = {};
  for (const k of SIGNED_PARAMS) if (params[k] !== undefined && params[k] !== "") out[k] = String(params[k]);
  return out;
}

export function signableString(params: SignedParams): string {
  return JSON.stringify(canonical(params));
}

export function sign(params: SignedParams, secret: string): string {
  return createHmac("sha256", secret).update(signableString(params)).digest("base64url");
}

export function verify(params: SignedParams, sig: string, secret: string | undefined): boolean {
  if (!secret || !sig) return false;
  const expected = Buffer.from(sign(params, secret));
  const given = Buffer.from(sig);
  return expected.length === given.length && timingSafeEqual(expected, given);
}

// The HMAC key: RENDER_SIGN_SECRET when set, otherwise the app secret (already required
// and never exposed). No extra secret to provision; rotating AUTH_SECRET rotates signatures.
export function signSecret(): string | undefined {
  return process.env.RENDER_SIGN_SECRET || process.env.AUTH_SECRET;
}