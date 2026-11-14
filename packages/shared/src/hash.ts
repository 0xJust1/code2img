// Node-only: SHA-256 cache keys. Kept out of the browser barrel (index.ts) so the web bundle
// doesn't pull in node:crypto. Import from "@code2img/shared/hash" on the server.
import { createHash } from "node:crypto";
import { normalizeConfig } from "./config";

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => a.localeCompare(b));
  return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${stableStringify(v)}`).join(",")}}`;
}

export function configHash(input: unknown): string {
  return createHash("sha256").update(stableStringify(normalizeConfig(input))).digest("hex");
}
