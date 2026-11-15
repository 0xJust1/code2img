import { z } from "zod";
import { FONTS, THEMES } from "./themes";
import { UPLOAD_FILE_RE, backgroundSchema } from "./backgrounds";

export const MAX_CODE_BYTES = 50_000;
export const DEFAULT_FONT_SIZE = 16;

export const ratioSchema = z.enum(["auto", "1:1", "16:9", "4:5", "og"]);
export type Ratio = z.infer<typeof ratioSchema>;
export const RATIO_DIMS: Record<Exclude<Ratio, "auto">, [number, number]> = {
  "1:1": [1200, 1200],
  "16:9": [1280, 720],
  "4:5": [1080, 1350],
  og: [1200, 630],
};

export const windowStyleSchema = z.enum(["mac", "windows", "minimal", "none"]);

export const cardConfigSchema = z.object({
  code: z.string().max(MAX_CODE_BYTES, "code exceeds 50 KB limit"),
  language: z.string().default("auto"), // shiki id or "auto"
  theme: z.string().default("github-dark"),
  font: z.string().default("jetbrains-mono"),
  fontSize: z.number().int().min(10).max(24).default(DEFAULT_FONT_SIZE),
  lineHeight: z.number().min(1.2).max(2.2).default(1.6),
  padding: z.number().int().min(0).max(128).default(48),
  radius: z.number().int().min(0).max(32).default(12),
  shadow: z.boolean().default(true),
  windowStyle: windowStyleSchema.default("mac"),
  title: z.string().max(120).default(""),
  lineNumbers: z.boolean().default(true),
  highlightLines: z.array(z.number().int().min(1)).max(50).default([]),
  ligatures: z.boolean().default(true),
  width: z.number().int().min(240).max(2000).nullable().default(null),
  ratio: ratioSchema.default("auto"),
  background: backgroundSchema.default({ type: "gradient", preset: "sunset" }),
  author: z
    .object({ name: z.string().max(80).default("") })
    .default({}),
  watermark: z.boolean().default(true),
  // Pro-only: uploaded logo, referenced by storage filename (resolved to a data URL
  // via `attachments` for trusted requests — see backgrounds.ts).
  logo: z.string().max(80).regex(UPLOAD_FILE_RE).optional(),
  anim: z.object({
    type: z.literal("typewriter"),
    durationMs: z.number().int().min(1000).max(15000).default(3000),
  }).optional(),
});

export type CardConfig = z.infer<typeof cardConfigSchema>;

export const defaultConfig = cardConfigSchema.parse({ code: "" });

export function validateTheme(theme: string): boolean {
  return (THEMES as readonly string[]).includes(theme);
}

export function validateFont(font: string): boolean {
  return FONTS.some((f) => f.id === font);
}

// Normalize: apply defaults + drop values equal to defaults, stable stringify -> cache key.
// This keeps identical visual configs on one cache entry regardless of field order.
export function normalizeConfig(input: unknown): CardConfig {
  return cardConfigSchema.parse(input);
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => a.localeCompare(b));
  return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${stableStringify(v)}`).join(",")}}`;
}

// ---- URL hash presets (editor <-> shareable link) ----
// Portable base64url (TextEncoder + btoa) so the same code runs in the browser and on the server.
function toB64Url(s: string): string {
  const bytes = new TextEncoder().encode(s);
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function fromB64Url(s: string): string {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/");
  return new TextDecoder().decode(Uint8Array.from(atob(b64), (c) => c.charCodeAt(0)));
}

export function encodePreset(config: CardConfig): string {
  return toB64Url(stableStringify(config));
}

export function decodePreset(raw: string): CardConfig | null {
  try {
    return normalizeConfig(JSON.parse(fromB64Url(raw)));
  } catch {
    return null;
  }
}
