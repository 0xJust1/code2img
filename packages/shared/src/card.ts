import { codeToHtml, bundledThemes } from "shiki";
import { APP_NAME, WATERMARK_TEXT, WATERMARK_URL } from "./brand";
import { backgroundCss } from "./backgrounds";
import { detectLanguage } from "./detect";
import { getFont, fontFiles } from "./themes";
import { RATIO_DIMS, type CardConfig } from "./config";

export interface CardHtmlOptions {
  /** Base URL for /fonts/:file (self-origin in render service, relative or absolute in editor preview). */
  fontBaseUrl?: string;
  /** Data URLs for uploaded assets, keyed by storage filename. Trusted callers only. */
  attachments?: Record<string, string>;
}

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// Perceived luminance of a #rrggbb color -> choose readable meta text color.
function textColorFor(bgHex: string): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(bgHex.trim());
  if (!m) return "#e8e8ee";
  const n = parseInt(m[1]!, 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  const lum = 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
  return lum > 0.45 ? "#1a1a20" : "#f4f4f8";
}

async function themeBackground(theme: string): Promise<string> {
  const loader = (bundledThemes as Record<string, unknown>)[theme];
  if (!loader) return "#0d1117";
  const t = (await (loader as () => Promise<{ default: { bg?: string } }> )()).default;
  return t.bg ?? "#0d1117";
}

async function highlight(code: string, language: string, theme: string): Promise<string> {
  try {
    return await codeToHtml(code, { lang: language, theme });
  } catch {
    // Unknown shiki lang/theme -> fall back so a bad preset can never 500 the render.
    try {
      return await codeToHtml(code, { lang: "text", theme });
    } catch {
      return `<pre><code>${escapeHtml(code)}</code></pre>`;
    }
  }
}

// Shiki emits one <span class="line"> per line; tag highlighted lines by position.
function markHighlighted(html: string, lines: number[]): string {
  if (lines.length === 0) return html;
  const set = new Set(lines);
  let i = 0;
  return html.replace(/<span class="line"/g, () => {
    i += 1;
    return set.has(i) ? '<span class="line hl"' : '<span class="line"';
  });
}

export async function buildCardHtml(config: CardConfig, opts: CardHtmlOptions = {}): Promise<string> {
  const font = getFont(config.font);
  // Uploaded assets resolve only when the caller supplied their bytes (trusted path);
  // otherwise the Pro-only features silently degrade to defaults.
  const bgImage =
    config.background.type === "image" ? opts.attachments?.[config.background.file] : undefined;
  const bgCss = bgImage ? `#000 url("${bgImage}") center/cover no-repeat` : backgroundCss(config.background);
  const logoSrc = config.logo ? opts.attachments?.[config.logo] : undefined;
  const lang = config.language === "auto" ? detectLanguage(config.code) : config.language;
  const codeHtml = markHighlighted(await highlight(config.code, lang, config.theme), config.highlightLines);
  const themeBg = await themeBackground(config.theme);
  const metaColor = textColorFor(themeBg);
  const fontBase = opts.fontBaseUrl ?? "/fonts";
  const [ratioW, ratioH] = RATIO_DIMS[config.ratio as Exclude<typeof config.ratio, "auto">] ?? [null, null];

  const titleBar =
    config.windowStyle === "none"
      ? ""
      : config.windowStyle === "windows"
        ? `<div class="titlebar win"><span class="title">${escapeHtml(config.title)}</span><span class="win-btns" aria-hidden="true"><span>&#x2500;</span><span>&#x2610;</span><span>&#x2715;</span></span></div>`
        : config.windowStyle === "minimal"
          ? `<div class="titlebar minimal"><span class="title">${escapeHtml(config.title)}</span></div>`
          : `<div class="titlebar mac"><span class="dots" aria-hidden="true"><i class="d1"></i><i class="d2"></i><i class="d3"></i></span><span class="title">${escapeHtml(config.title)}</span></div>`;

  const showMeta = Boolean(config.author.name || config.author.link || config.watermark || logoSrc);
  const authorLink = config.author.link
    ? `<a href="${escapeHtml(config.author.link)}" rel="noopener">${escapeHtml(config.author.name || config.author.link)}</a>`
    : escapeHtml(config.author.name);
  const logoHtml = logoSrc ? `<img class="logo" src="${logoSrc}" alt="">` : "";
  const meta = showMeta
    ? `<div class="meta"><span class="author">${logoHtml}${authorLink}</span>${
        config.watermark ? `<a class="watermark" href="${WATERMARK_URL}">${WATERMARK_TEXT}</a>` : ""
      }</div>`
    : "";

  const fontFaces = fontFiles(font)
    .map(
      (f) =>
        `@font-face{font-family:'${font.family}';src:url('${fontBase}/${f.file}') format('woff2');font-weight:${f.weight};font-style:normal;font-display:block}`,
    )
    .join("\n");

  const captureStyle =
    ratioW && ratioH
      ? `width:${ratioW}px;height:${ratioH}px;display:flex;align-items:center;justify-content:center;overflow:hidden`
      : "display:inline-block";

  const cardStyle = [
    `padding:${config.padding}px`,
    `border-radius:${config.radius}px`,
    config.shadow ? "box-shadow:0 20px 60px rgba(0,0,0,.35)" : "",
    config.width ? `width:${config.width}px` : "",
    ratioW ? "max-width:92%;max-height:92%;overflow:hidden" : "",
  ]
    .filter(Boolean)
    .join(";");

  // escapeHtml only around user-provided interpolations; the shiki payload is already safe HTML.
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<title>${APP_NAME}</title>
<style>
${fontFaces}
*{box-sizing:border-box}body{margin:0;background:${config.background.type === "transparent" ? "transparent" : bgCss}}
#capture{background:${bgCss};${captureStyle}}
.card{background:${themeBg};${cardStyle};color:${metaColor};font-family:'${font.family}',ui-monospace,monospace}
.titlebar{display:flex;align-items:center;gap:10px;padding:12px 16px;border-bottom:1px solid rgba(128,128,140,.25);font-size:12px;color:${metaColor};opacity:.9}
.titlebar .title{flex:1;text-align:center;font-family:ui-sans-serif,system-ui,sans-serif;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.dots{display:inline-flex;gap:8px}.dots i{width:12px;height:12px;border-radius:50%;display:inline-block}
.d1{background:#ff5f57}.d2{background:#febc2e}.d3{background:#28c840}
.win-btns{display:inline-flex;gap:14px;opacity:.7}
pre{margin:0;padding:20px 0 4px;overflow:hidden;white-space:pre;font-size:${config.fontSize}px;line-height:${config.lineHeight};font-variant-ligatures:${config.ligatures ? "contextual" : "no-common-ligatures"};font-feature-settings:${config.ligatures ? '"liga","calt"' : '"liga" 0,"calt" 0'}}
pre .line{display:inline-block;min-width:100%;padding-inline:20px;counter-increment:line}
${config.lineNumbers ? `pre .line::before{content:counter(line);display:inline-block;width:2.2em;margin-right:1.4em;text-align:right;opacity:.4}` : ""}
pre .line.hl{background:rgba(125,125,160,.22);box-shadow:inset 3px 0 0 rgba(125,125,160,.6)}
.meta{display:flex;justify-content:space-between;align-items:center;gap:16px;padding:10px 20px 14px;font-family:ui-sans-serif,system-ui,sans-serif;font-size:12px}
.meta a{color:inherit;text-decoration:none;opacity:.75}
.meta a:hover{opacity:1;text-decoration:underline}
.meta .logo{height:20px;max-width:160px;object-fit:contain;vertical-align:middle;margin-right:8px}
pre code{counter-reset:line;display:block}
</style></head>
<body><div id="capture"><div class="card">
${titleBar}
${codeHtml}
${meta}
</div></div></body></html>`;
}
