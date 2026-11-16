// Submits every URL of the public sitemap to IndexNow (Bing, Yandex, Seznam, Naver…).
// Run from apps/web: `node scripts/indexnow.mjs` (add `--dry-run` to print the payload without POSTing).
//
// The key is not duplicated here: it is read from public/<key>.txt, the file served at
// https://code2img.app/<key>.txt — IndexNow fetches that URL to verify ownership of the host.
// Override with INDEXNOW_KEY / INDEXNOW_HOST / INDEXNOW_SITEMAP if the site moves.
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const web = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const publicDir = path.join(web, "public");
const dryRun = process.argv.includes("--dry-run");

const host = (process.env.INDEXNOW_HOST ?? "code2img.app").replace(/^https?:\/\//, "").replace(/\/+$/, "");
const sitemapUrl = process.env.INDEXNOW_SITEMAP ?? `https://${host}/sitemap.xml`;

/** The key file is the 32-hex `<key>.txt` at the root of public/ (fixed name, generated once). */
function readKey() {
  if (process.env.INDEXNOW_KEY) return process.env.INDEXNOW_KEY;
  const candidates = readdirSync(publicDir).filter((f) => /^[0-9a-f]{32}\.txt$/.test(f));
  if (candidates.length !== 1) {
    throw new Error(
      `expected exactly one public/<32-hex>.txt key file, found ${candidates.length}` +
        (candidates.length ? `: ${candidates.join(", ")}` : ""),
    );
  }
  const key = readFileSync(path.join(publicDir, candidates[0]), "utf8").trim();
  if (!/^[0-9a-f]{32}$/.test(key)) throw new Error(`${candidates[0]} does not contain a 32-hex key`);
  return key;
}

async function sitemapUrls() {
  const res = await fetch(sitemapUrl, { signal: AbortSignal.timeout(15_000) });
  if (!res.ok) throw new Error(`GET ${sitemapUrl} → ${res.status}`);
  const xml = await res.text();
  const urls = [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => m[1]);
  if (urls.length === 0) throw new Error(`no <loc> found in ${sitemapUrl}`);
  // Only submit URLs of the host that serves the key, deduplicated.
  return [...new Set(urls)].filter((u) => {
    try {
      return new URL(u).host === host;
    } catch {
      return false;
    }
  });
}

const key = readKey();
const payload = {
  host,
  key,
  keyLocation: `https://${host}/${key}.txt`,
  urlList: await sitemapUrls(),
};

if (dryRun) {
  console.log(JSON.stringify(payload, null, 2));
  process.exit(0);
}

const res = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: { "Content-Type": "application/json; charset=utf-8" },
  body: JSON.stringify(payload),
  signal: AbortSignal.timeout(30_000),
});

// IndexNow replies 200 (accepted) or 202 (accepted, key pending validation); anything else is a failure.
console.log(`POST api.indexnow.org/indexnow → ${res.status} ${res.statusText} (${payload.urlList.length} URLs)`);
const body = await res.text();
if (body.trim()) console.log(body.trim());
if (res.status !== 200 && res.status !== 202) process.exit(1);
