#!/usr/bin/env node
// Contract check against a LIVE instance: every documented path must answer, and the
// documented behaviour (401/429 problem details, idempotency, stored images, signatures)
// must hold for real. Usage: BASE_URL=http://192.168.1.45:3335 API_KEY=c2i_live_… node scripts/api-contract.mjs

const BASE = (process.env.BASE_URL ?? "http://127.0.0.1:3335").replace(/\/$/, "");
const API = `${BASE}/api/v1`;
const KEY = process.env.API_KEY;
const results = [];

function check(name, cond, extra = "") {
  results.push({ name, ok: Boolean(cond), extra: cond ? "" : String(extra) });
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${cond ? "" : ` → ${extra}`}`);
}

const auth = (k = KEY) => ({ authorization: `Bearer ${k}`, "content-type": "application/json" });
const isPng = (buf) => buf.length > 8 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47;

async function postJson(path, body, headers = auth()) {
  return fetch(`${API}${path}`, { method: "POST", headers, body: JSON.stringify(body) });
}

async function main() {
  // 1. Published contract
  const specRes = await fetch(`${API}/openapi.json`);
  const spec = await specRes.json().catch(() => ({}));
  const paths = Object.keys(spec.paths ?? {});
  check("openapi.json is served", specRes.ok && spec.openapi?.startsWith("3.1"), specRes.status);
  check("openapi documents every endpoint", paths.length >= 10, `only ${paths.length} paths`);

  // 2. Every documented path exists (no 404 from the router)
  for (const p of paths) {
    if (p.includes("{id}")) continue; // lifecycle (GET/DELETE with a real id) is checked below
    // spec paths are absolute from /api (/v1/...), API is already the /api/v1 base
    const url = `${BASE}/api${p}`;
    const res = await fetch(url);
    check(`route exists: GET ${p}`, res.status !== 404, res.status);
  }

  // 3. Catalogs are public
  const themes = await (await fetch(`${API}/themes`)).json();
  check("themes catalog", Array.isArray(themes.themes) && themes.themes.includes("github-dark"), JSON.stringify(themes).slice(0, 80));
  for (const kind of ["languages", "fonts", "backgrounds"]) {
    const res = await fetch(`${API}/${kind}`);
    check(`catalog ${kind}`, res.ok, res.status);
  }

  // 4. Auth failures are RFC 9457 problems
  const noKey = await postJson("/images", { code: "x" }, { "content-type": "application/json" });
  const noKeyBody = await noKey.json().catch(() => ({}));
  check("missing key → 401 problem+json", noKey.status === 401 && noKey.headers.get("content-type")?.includes("problem+json"), noKey.status);
  check("problem has type/title/status", Boolean(noKeyBody.type && noKeyBody.title && noKeyBody.status), JSON.stringify(noKeyBody));
  const badKey = await postJson("/images", { code: "x" }, auth("c2i_live_deadbeef_nope"));
  check("revoked/unknown key → 401", badKey.status === 401, badKey.status);
  check("WWW-Authenticate on 401", noKey.headers.get("www-authenticate")?.startsWith("Bearer"), noKey.headers.get("www-authenticate"));

  if (!KEY) {
    check("API_KEY provided", false, "set API_KEY to run the authenticated checks");
    return summary();
  }

  // 5. Render (binary)
  const render = await postJson("/images", { code: "console.log('contract')", theme: "dracula", lang: "javascript" });
  const png = new Uint8Array(await render.arrayBuffer());
  check("POST /v1/images → 200 image/png", render.status === 200 && isPng(png), `${render.status} ${png.length} bytes`);
  check("X-RateLimit-* headers", render.headers.get("x-ratelimit-limit") !== null && render.headers.get("x-ratelimit-remaining") !== null, render.headers.get("x-ratelimit-limit"));

  // 6. Idempotency
  const idemKey = `contract-${Date.now()}`;
  const first = await postJson("/images", { code: "npm i code2img", response_type: "url" }, { ...auth(), "idempotency-key": idemKey });
  const firstBody = await first.json().catch(() => ({}));
  check("POST response_type=url → 201 with id+url", first.status === 201 && firstBody.id && firstBody.url, `${first.status} ${JSON.stringify(firstBody).slice(0, 100)}`);
  const replay = await postJson("/images", { code: "npm i code2img", response_type: "url" }, { ...auth(), "idempotency-key": idemKey });
  const replayBody = await replay.json().catch(() => ({}));
  check("idempotent replay returns the same image", replayBody.id === firstBody.id, JSON.stringify(replayBody).slice(0, 100));
  const mismatch = await postJson("/images", { code: "different", response_type: "url" }, { ...auth(), "idempotency-key": idemKey });
  check("same Idempotency-Key + different body → 422", mismatch.status === 422, mismatch.status);

  // 7. Stored image lifecycle
  const img = await fetch(firstBody.url);
  check("stored image URL is public and PNG", img.ok && isPng(new Uint8Array(await img.arrayBuffer())), img.status);
  const del = await fetch(`${API}/images/${firstBody.id}`, { method: "DELETE", headers: auth() });
  check("DELETE image → 204", del.status === 204, del.status);
  const gone = await fetch(`${API}/images/${firstBody.id}`);
  check("deleted image → 404 problem", gone.status === 404, gone.status);

  // 8. Signed URL
  const signed = await postJson("/signed-url", { code: "console.log('badge')", theme: "nord", bg: "ocean" });
  const signedBody = await signed.json().catch(() => ({}));
  check("POST /v1/signed-url → 201 url", signed.status === 201 && Boolean(signedBody.url), `${signed.status} ${JSON.stringify(signedBody).slice(0, 120)}`);
  if (signedBody.url) {
    const badge = await fetch(signedBody.url.replace("https://code2img.app", BASE));
    check("signed render.png → PNG without key", badge.ok && isPng(new Uint8Array(await badge.arrayBuffer())), badge.status);
    const tampered = `${signedBody.url.replace("https://code2img.app", BASE).replace(encodeURIComponent("badge"), encodeURIComponent("hacked"))}`;
    const refused = await fetch(tampered);
    check("tampered signature → 403", refused.status === 403, refused.status);
  }

  // 9. Usage
  const usage = await fetch(`${API}/usage`, { headers: auth() });
  const usageBody = await usage.json().catch(() => ({}));
  check("GET /v1/usage → plan+limits+counters", usage.ok && usageBody.plan && usageBody.limits?.per_minute > 0 && typeof usageBody.api_calls === "number", JSON.stringify(usageBody).slice(0, 120));

  // 10. Uploads refuse non-Pro with a problem
  const form = new FormData();
  form.set("kind", "logo");
  const up = await fetch(`${API}/uploads`, { method: "POST", headers: { authorization: `Bearer ${KEY}` }, body: form });
  check("POST /v1/uploads without file → problem", [400, 402].includes(up.status) && up.headers.get("content-type")?.includes("problem+json"), up.status);

  // 11. Quota: keep hammering until the window closes (renders are cached, so it is cheap)
  const limit = Number(render.headers.get("x-ratelimit-limit") ?? 0);
  let hit429 = null;
  for (let i = 0; i < Math.max(limit, 1) + 2; i += 1) {
    const res = await postJson("/images", { code: "console.log('contract')", theme: "dracula", lang: "javascript" });
    if (res.status === 429) {
      const body = await res.json().catch(() => ({}));
      hit429 = { res, body };
      break;
    }
  }
  check("quota → 429 problem + Retry-After", Boolean(hit429) && hit429.res.headers.get("retry-after") && hit429.body.status === 429 && hit429.res.headers.get("x-ratelimit-remaining") === "0", hit429 ? `${hit429.res.status} retry=${hit429.res.headers.get("retry-after")}` : "no 429 after the window budget");

  summary();
}

function summary() {
  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  if (failed.length) {
    console.log("FAILED:", failed.map((f) => `${f.name} (${f.extra})`).join(" | "));
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error("contract run crashed:", err?.message ?? err);
  process.exitCode = 1;
});