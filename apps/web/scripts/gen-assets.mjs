// Regenerates every brand bitmap from the SVG mark: favicons, app icons, the default OG card.
// Run from apps/web: `pnpm exec node ../../scripts/gen-assets.mjs` (needs the render service for examples).
import { chromium } from "@playwright/test";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";

const web = path.resolve(process.argv[2] ?? ".");
const pub = path.join(web, "public");
const ink = "#f2f3f5";
const accent = "#5b9dff";
const ground = "#08090a";

const markSvg = (size, fg = ink) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 32 32">
  <g fill="none" stroke="${fg}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
    <path d="M10.6 8.6 4 16l6.6 7.4"/><path d="M21.4 8.6 28 16l-6.6 7.4"/>
  </g>
  <rect x="12.9" y="12.9" width="6.2" height="6.2" rx="1.6" fill="${accent}"/>
</svg>`;

// Adaptive mark (any background): transparent, currentColor at use site.
mkdirSync(path.join(pub, "brand"), { recursive: true });
writeFileSync(path.join(pub, "brand", "mark.svg"), markSvg(32));

// Favicon: the mark on its own dark tile so it survives a light tab bar.
const tile = (size) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="7" fill="${ground}"/>
  <g transform="translate(4.6 4.6) scale(0.7125)">${markSvg(32).replace(/<\/?svg[^>]*>/g, "")}</g>
</svg>`;
writeFileSync(path.join(pub, "favicon.svg"), tile(32));

const ogHtml = `<!doctype html><html><head><meta charset="utf-8"><style>
  *{margin:0;box-sizing:border-box}
  body{width:1200px;height:630px;background:${ground};color:${ink};
    font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Inter,sans-serif;
    display:grid;grid-template-columns:1fr 460px;grid-template-rows:auto 1fr auto;gap:0 48px;
    align-items:center;padding:56px 64px;overflow:hidden}
  .brand{display:flex;align-items:center;gap:16px;font-size:30px;font-weight:650;letter-spacing:-0.02em;
    grid-column:1/-1;align-self:start}
  h1{font-size:66px;line-height:1;letter-spacing:-0.035em;font-weight:600}
  p{font-size:22px;color:#a9aeb8;margin-top:20px;max-width:30ch}
  .card{background:#0e0f11;border-radius:14px;padding:0 0 22px;overflow:hidden;align-self:center}
  .bar{display:flex;align-items:center;gap:7px;padding:14px 18px;background:#141518;font-size:15px;color:#8a8f9a}
  .dot{width:11px;height:11px;border-radius:50%;background:#363942}
  .bar .name{margin-left:8px;font-family:ui-monospace,Menlo,monospace}
  .code{padding:18px 22px 0;font-family:ui-monospace,"JetBrains Mono",Menlo,monospace;font-size:17px;
    line-height:1.75;color:#c8ccd4;white-space:pre}
  .k{color:#5b9dff}.s{color:#8fd6a0}.c{color:#6b6e76}
  .f{display:flex;justify-content:space-between;color:#8a8f9a;font-size:19px;grid-column:1/-1;align-self:end}
</style></head><body>
  <div class="brand">${markSvg(40)}<span>Code2Img</span></div>
  <div>
    <h1>Turn code<br>into an image.</h1>
    <p>Paste a snippet, pick a theme, export a pixel-perfect PNG.</p>
  </div>
  <div class="card">
    <div class="bar"><span class="dot"></span><span class="dot"></span><span class="dot"></span><span class="name">greet.ts</span></div>
    <div class="code"><span class="c">export function</span> <span class="k">greet</span>(name: string) {
  <span class="c">return</span> <span class="s">Hello, \${name}!</span>;
}</div>
  </div>
  <div class="f"><span>code2img.app</span><span>PNG · JPG · PDF · API · MCP</span></div>
</body></html>`;

// Examples rendered by the product itself (the render service on :3002).
const examples = [
  { file: "hero", theme: "github-dark", bg: { type: "gradient", preset: "midnight" }, title: "cart.ts", lang: "typescript",
    code: `// cart.ts\nimport { price } from "./pricing";\n\nexport const total = (items: Item[]) =>\n  items.reduce(\n    (sum, i) => sum + price(i) * i.qty,\n    0,\n  );` },
  { file: "example-tokyo", theme: "tokyo-night", bg: { type: "gradient", preset: "steel" }, title: "deploy.sh", lang: "bash",
    code: `#!/usr/bin/env bash\nset -euo pipefail\n\nfor host in web-1 web-2; do\n  echo "deploying to $host"\n  rsync -az ./dist/ "$host:/srv/app"\ndone` },
  { file: "example-latte", theme: "catppuccin-latte", bg: { type: "solid", color: "#e8e6e1" }, title: "App.tsx", lang: "tsx",
    code: `export function App() {\n  const [count, setCount] = useState(0);\n  return (\n    <button onClick={() => setCount(count + 1)}>\n      clicked {count} times\n    </button>\n  );\n}` },
  { file: "example-rose", theme: "rose-pine", bg: { type: "gradient", preset: "grape" }, title: "query.sql", lang: "sql",
    code: `select u.email, count(i.id) as images\nfrom users u\n  join images i on i.user_id = u.id\nwhere i.created_at > now() - interval '30 days'\ngroup by 1\norder by 2 desc;` },
  { file: "example-nord", theme: "nord", bg: { type: "pattern", pattern: "grid", color: "#3b4252", base: "#2e3440" }, title: "main.go", lang: "go",
    code: `func main() {\n\tctx := context.Background()\n\tkey, err := loadKey(ctx)\n\tif err != nil {\n\t\tlog.Fatal(err)\n\t}\n\tfmt.Println(key)` },
  { file: "example-dracula", theme: "dracula", bg: { type: "gradient", preset: "forest" }, title: "train.py", lang: "python",
    code: `def train(model, loader, epochs=3):\n    for epoch in range(epochs):\n        for batch in loader:\n            loss = model.step(batch)\n        print(f"epoch {epoch} loss {loss:.3f}")` },
  { file: "example-min", theme: "min-light", bg: { type: "solid", color: "#f4f1ea" }, title: "notes.rs", lang: "rust",
    code: `#[derive(Debug)]\npub struct Note {\n    pub id: Uuid,\n    pub body: String,\n}\n\nimpl Note {\n    pub fn new(body: impl Into<String>) -> Self {\n        Self { id: Uuid::new_v4(), body: body.into() }\n    }\n}` },
];

const browser = await chromium.launch();
const shot = async (html, file, w, h, scale = 1) => {
  const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: scale });
  await page.setContent(html, { waitUntil: "load" });
  await page.screenshot({ path: file, omitBackground: true });
  await page.close();
};

mkdirSync(path.join(pub, "brand"), { recursive: true });
await shot(tile(512), path.join(pub, "brand", "icon-512.png"), 512, 512);
await shot(tile(192), path.join(pub, "brand", "icon-192.png"), 192, 192);
await shot(tile(180), path.join(pub, "brand", "apple-touch-icon.png"), 180, 180);
await shot(tile(32), path.join(pub, "brand", "favicon-32.png"), 32, 32);
await shot(tile(16), path.join(pub, "brand", "favicon-16.png"), 16, 16);
await shot(ogHtml, path.join(pub, "og.png"), 1200, 630);

// ICO = a container of PNGs; hand-wrap the 16 and 32 px frames (no extra dependency).
const pngs = [16, 32].map((n) => ({ n, buf: readFileSync(path.join(pub, "brand", `favicon-${n}.png`)) }));
const ico = (entries) => {
  const head = Buffer.alloc(6);
  head.writeUInt16LE(0, 0); head.writeUInt16LE(1, 2); head.writeUInt16LE(entries.length, 4);
  let offset = 6 + 16 * entries.length;
  const dir = Buffer.alloc(16 * entries.length);
  entries.forEach(({ n, buf }, i) => {
    const o = i * 16;
    dir.writeUInt8(n >= 256 ? 0 : n, o);
    dir.writeUInt8(n >= 256 ? 0 : n, o + 1);
    dir.writeUInt8(0, o + 2); dir.writeUInt8(0, o + 3);
    dir.writeUInt16LE(1, o + 4); dir.writeUInt16LE(32, o + 6);
    dir.writeUInt32LE(buf.length, o + 8); dir.writeUInt32LE(offset, o + 12);
    offset += buf.length;
  });
  return Buffer.concat([head, dir, ...entries.map((e) => e.buf)]);
};
writeFileSync(path.join(pub, "favicon.ico"), ico(pngs));

// Gallery: the product renders its own examples, so the pictures are real output.
mkdirSync(path.join(pub, "examples"), { recursive: true });
for (const ex of examples) {
  const config = {
    code: ex.code, language: ex.lang, theme: ex.theme, font: "jetbrains-mono", fontSize: 15,
    lineHeight: 1.6, padding: 48, radius: 12, shadow: true, windowStyle: "mac", title: ex.title,
    lineNumbers: true, ratio: ex.file === "hero" ? "auto" : "16:9", background: ex.bg, watermark: true,
  };
  // jpg: these cards end up on a full-bleed background, no transparency needed, and a PNG of a
  // dithered gradient costs 1 MB while the same picture as JPEG costs a tenth of it.
  // Two widths: a phone gets the 1× file, a desktop the 2× one (srcset in the pages).
  for (const [scale, suffix] of [[2, ""], [1, "-sm"]]) {
    const res = await fetch("http://127.0.0.1:3002/render", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ config, format: "jpg", scale, quality: 88 }),
    });
    if (!res.ok) { console.error(ex.file, res.status, await res.text()); process.exitCode = 1; continue; }
    writeFileSync(path.join(pub, "examples", `${ex.file}${suffix}.jpg`), Buffer.from(await res.arrayBuffer()));
    console.log("example", ex.file + suffix);
  }
}

await browser.close();
console.log("brand assets written to", pub);