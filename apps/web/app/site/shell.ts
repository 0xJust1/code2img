// Marketing pages are plain HTML documents served by route handlers: no React runtime on the
// critical path, one inline stylesheet, one small inline script. The editor, dashboard and share
// pages stay React. The landing used to ship 33 KB of Next flight data and six JS chunks; a phone
// paid for all of it before the first paint.
import { readFileSync } from "node:fs";
import path from "node:path";
import { APP_NAME, APP_URL, DETECTED_LANGUAGES, FONTS, THEMES } from "@code2img/shared";
import { REVEAL_JS } from "../reveal";

export type Lang = "en" | "fr";
export const BASE = APP_URL;
/** Public repo does not exist yet (github.com/0xjust1/code2img and VaultKeepR/code2img both 404,
 *  verified 2026-11-15): the footer links the author profile until the repo transfer happens. */
export const GITHUB_URL = "https://github.com/0xjust1";

const ROOT = process.cwd();
function readFile(rel: string): string {
  try {
    return readFileSync(path.join(ROOT, rel), "utf8");
  } catch {
    return readFileSync(path.join(ROOT, "apps", "web", rel), "utf8");
  }
}

let cssCache: string | null = null;
/** tokens + the shared base + the marketing sheet, inlined: no render-blocking request. */
export function siteCss(): string {
  cssCache ??= ["app/tokens.css", "app/globals.css", "app/nav.css", "app/landing.css"].map(readFile).join("\n");
  return cssCache;
}

const contentCache = new Map<string, string>();
/** A content fragment: content/<name>.html, hand-written HTML (no markdown step, no dependency).
 *  Every block carries class="reveal" (merged with an existing class), so prose enters the way
 *  the other sections do. */
export function content(name: string): string {
  const hit = contentCache.get(name);
  if (hit !== undefined) return hit;
  const html = readFile(`content/${name}.html`)
    .replace(/<!--\s*@lang:(fr|en)\s*-->/g, "")
    .replace(/<(h2|h3|p|ul|ol|pre|figure|table)((?:\s[^>]*)?)>/g, (_m: string, tag: string, attrs: string) =>
      attrs.includes('class="')
        ? `<${tag}${attrs.replace(/class="/, 'class="reveal ')}>`
        : `<${tag} class="reveal"${attrs}>`,
    );
  contentCache.set(name, html);
  return html;
}

export interface Meta {
  title: string;
  description: string;
  /** canonical path on this site, e.g. "/pricing" */
  path: string;
  lang: Lang;
  /** the counterpart page in the other language, when one exists (drives hreflang) */
  alt?: string;
  jsonLd?: unknown[];
  ogImage?: string;
  /** a picture on the first screen, worth a preload (the hero image only) */
  preload?: string;
  noindex?: boolean;
  nav?: string;
}

const MARK = `<svg width="22" height="22" viewBox="0 0 32 32" aria-hidden="true" focusable="false"><g fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M10.6 8.6 4 16l6.6 7.4"/><path d="M21.4 8.6 28 16l-6.6 7.4"/></g><rect x="12.9" y="12.9" width="6.2" height="6.2" rx="1.6" fill="var(--accent)"/></svg>`;

export function wordmark(lang: Lang): string {
  return `<a href="${lang === "fr" ? "/fr" : "/"}" class="wordmark" aria-label="${APP_NAME} — code to image">${MARK}<span>Code<span class="wordmark-two">2</span>Img</span></a>`;
}

const GLOBE = `<svg width="15" height="15" viewBox="0 0 16 16" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.4"><circle cx="8" cy="8" r="6.4"/><ellipse cx="8" cy="8" rx="2.9" ry="6.4"/><path d="M1.8 8h12.4"/></svg>`;

export function nav(lang: Lang, active = ""): string {
  const t = NAV[lang];
  const p = (href: string, label: string, cls = "mk-navlink") =>
    `<a class="${cls}" href="${href}"${active === href ? ' aria-current="page"' : ""}>${label}</a>`;
  const other = lang === "fr" ? { href: "/", label: "EN" } : { href: "/fr", label: "FR" };
  const prefix = lang === "fr" ? "/fr" : "";
  return `<header class="mk-nav"><div class="mk-wrap">${wordmark(lang)}<nav class="mk-links" aria-label="${t.main}">${p(
    "/editor",
    t.editor,
  )}${p(
    `${prefix}/pricing`,
    t.pricing,
  )}${p("/docs", t.api)}${p("/mcp", t.mcp)}${p("/blog", t.blog)}<a class="lang" href="${other.href}" hreflang="${other.label.toLowerCase()}" lang="${other.label.toLowerCase()}" aria-label="Switch to ${other.label.toLowerCase()}">${GLOBE}${other.label}</a></nav></div></header>`;
}

export function footer(lang: Lang): string {
  const t = NAV[lang];
  const prefix = lang === "fr" ? "/fr" : "";
  return `<footer class="mk-foot"><div class="mk-wrap">${wordmark(lang)}<div class="cols">
<nav aria-label="${t.product}"><a href="/editor">${t.editor}</a><a href="${prefix}/pricing">${t.pricing}</a><a href="/dashboard">${t.dashboard}</a><a href="/blog">${t.blog}</a><a href="/changelog">${t.changelog}</a></nav>
<nav aria-label="${t.developers}"><a href="/docs">${t.apiRef}</a><a href="/mcp">MCP server</a><a href="/api/v1/openapi.json">OpenAPI spec</a><a href="/llms.txt">llms.txt</a><a href="${GITHUB_URL}" rel="noopener" target="_blank">GitHub</a></nav>
<nav aria-label="${t.compare}"><a href="/vs/ray-so">Code2Img vs ray.so</a><a href="/vs/carbon">Code2Img vs Carbon</a><a href="/vs/snappify">Code2Img vs Snappify</a></nav>
<nav aria-label="${t.legalHeading}"><a href="/legal/terms">${t.terms}</a><a href="/legal/privacy">${t.privacy}</a><a href="${prefix}/legal/mentions">${t.mentions}</a><a href="${prefix}/contact">${t.contact}</a></nav>
</div><p class="legal"><span>© ${new Date().getFullYear()} ${APP_NAME}.</span><span>${t.madeInFrance}</span><span>${t.independent}</span><span class="icons"><a class="icon" href="${GITHUB_URL}" rel="noopener" target="_blank" aria-label="GitHub"><svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07 1.87 3.75 3.65 3.95-.29.25-.54.73-.54 1.48 0 1.07.01 1.93.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z"/></svg></a><a class="icon" href="https://x.com/0xJust1" rel="noopener" target="_blank" aria-label="X (Twitter)"><svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg></a></span></p></div></footer>`;
}

interface NavLabels {
  main: string;
  features: string;
  pricing: string;
  api: string;
  mcp: string;
  blog: string;
  cta: string;
  editor: string;
  dashboard: string;
  changelog: string;
  apiRef: string;
  developers: string;
  product: string;
  compare: string;
  legalHeading: string;
  terms: string;
  privacy: string;
  mentions: string;
  contact: string;
  independent: string;
  madeInFrance: string;
}

const NAV: Record<Lang, NavLabels> = {
  en: {
    main: "Main",
    features: "Features",
    pricing: "Pricing",
    api: "API",
    mcp: "MCP",
    blog: "Blog",
    cta: "Open the editor",
    editor: "Editor",
    dashboard: "Dashboard",
    changelog: "Changelog",
    apiRef: "API reference",
    developers: "Developers",
    product: "Product",
    compare: "Comparisons",
    legalHeading: "Contact and legal",
    terms: "Terms",
    privacy: "Privacy",
    mentions: "Legal notice",
    contact: "Contact",
    independent: "Independent product.",
    madeInFrance: "Made in France with ❤️",
  },
  fr: {
    main: "Navigation",
    features: "Fonctionnalités",
    pricing: "Tarifs",
    api: "API",
    mcp: "MCP",
    blog: "Blog",
    cta: "Ouvrir l'éditeur",
    editor: "Éditeur",
    dashboard: "Tableau de bord",
    changelog: "Journal",
    apiRef: "Référence API",
    developers: "Développeurs",
    product: "Produit",
    compare: "Comparatifs",
    legalHeading: "Contact et mentions",
    terms: "Conditions",
    privacy: "Confidentialité",
    mentions: "Mentions légales",
    contact: "Contact",
    independent: "Produit indépendant.",
    madeInFrance: "Fabriqué en France avec ❤️",
  },
};

/** The full document. Everything the browser needs is here: no framework, no extra request. */
/**
 * Every page gets its own Open Graph card, drawn by the product's own renderer. If the render
 * fails, /api/og answers a 302 to the static /og.png, so a page can never ship a broken preview.
 */
function dynamicOg(meta: Meta): string {
  const host = BASE.replace(/^https?:\/\//, "");
  const title = meta.title.replace(/\s+[—–]\s+Code2Img$/, "");
  return `/api/og?title=${encodeURIComponent(title)}&sub=${encodeURIComponent(host + meta.path)}`;
}

/** Gathers head, nav and footer around a body fragment. */

export function doc(meta: Meta, body: string): string {
  const url = `${BASE}${meta.path === "/" ? "/" : meta.path}`;
  const alts: string[] = [];
  if (meta.alt) {
    const en = meta.lang === "en" ? meta.path : meta.alt;
    const fr = meta.lang === "fr" ? meta.path : meta.alt;
    alts.push(
      `<link rel="alternate" hreflang="en" href="${BASE}${en === "/" ? "/" : en}">`,
      `<link rel="alternate" hreflang="fr" href="${BASE}${fr === "/" ? "/" : fr}">`,
      `<link rel="alternate" hreflang="x-default" href="${BASE}${en === "/" ? "/" : en}">`,
    );
  }
  const og = meta.ogImage ?? dynamicOg(meta);
  const ld = (meta.jsonLd ?? [])
    .map((b) => `<script type="application/ld+json">${JSON.stringify(b)}</script>`)
    .join("");
  return `<!doctype html>
<html lang="${meta.lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(meta.title)}</title>
<meta name="description" content="${esc(meta.description)}">
<link rel="canonical" href="${url}">
${alts.join("\n")}
<meta name="theme-color" content="#08090a">
<meta name="application-name" content="${APP_NAME}">
${meta.noindex ? '<meta name="robots" content="noindex,follow">' : '<meta name="robots" content="index,follow">'}
<meta property="og:type" content="website">
<meta property="og:site_name" content="${APP_NAME}">
<meta property="og:title" content="${esc(meta.title)}">
<meta property="og:description" content="${esc(meta.description)}">
<meta property="og:url" content="${url}">
<meta property="og:locale" content="${meta.lang === "fr" ? "fr_FR" : "en_US"}">
<meta property="og:image" content="${og.startsWith("http") ? og : BASE + og}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(meta.title)}">
<meta name="twitter:description" content="${esc(meta.description)}">
<meta name="twitter:image" content="${og.startsWith("http") ? og : BASE + og}">
<link rel="icon" href="/favicon.svg?v=2" type="image/svg+xml">
<link rel="icon" href="/brand/favicon-16.png?v=2" sizes="16x16" type="image/png">
<link rel="icon" href="/brand/favicon-32.png?v=2" sizes="32x32" type="image/png">
<link rel="icon" href="/brand/icon-192.png?v=2" sizes="192x192" type="image/png">
<link rel="icon" href="/brand/icon-512.png?v=2" sizes="512x512" type="image/png">
<link rel="icon" href="/favicon.ico?v=2" sizes="any">
<link rel="apple-touch-icon" href="/brand/apple-touch-icon.png?v=2" sizes="180x180">
<link rel="manifest" href="/manifest.webmanifest?v=2">
${ld}
${meta.preload ? `<link rel="preload" as="image" href="${meta.preload}" fetchpriority="high">` : ""}
<script>document.documentElement.classList.add('js')</script>
<style>${siteCss()}</style>
</head>
<body class="mk">
${body}
<script>${REVEAL_JS}</script>
<script defer src="https://analytics.vaultkeepr.xyz/script.js" data-website-id="ff088c49-bd07-4821-bd81-be1a6e96bf68"></script>
</body>
</html>`;
}

export function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function send(document: string): Response {
  return new Response(document, { headers: { "content-type": "text/html; charset=utf-8" } });
}

export interface FaqItem {
  q: string;
  a: string;
}

export function faqBlock(items: FaqItem[]): string {
  return `<div class="faq" data-stagger>${items
    .map((f) => `<details class="reveal"><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`)
    .join("")}</div>`;
}

export function faqJsonLd(items: FaqItem[]): unknown {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

/** Breadcrumbs for a document at any depth. The language is passed by callers for symmetry only. */
export function breadcrumbs(page: { name: string; path: string }[], _lang: Lang): unknown {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: page.map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: p.name,
      item: `${BASE}${p.path}`,
    })),
  };
}

export function homeJsonLd(lang: Lang, monthly: number, faq: FaqItem[]): unknown[] {
  const name = lang === "fr" ? "Code2Img" : APP_NAME;
  return [
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name,
      applicationCategory: "DeveloperApplication",
      operatingSystem: "Web",
      url: lang === "fr" ? `${BASE}/fr` : BASE,
      description:
        lang === "fr"
          ? "Transformez un extrait de code en image (PNG, JPG ou PDF), en lien partageable, en API REST et en serveur MCP pour agents IA."
          : "Turn a code snippet into an image (PNG, JPG or PDF), a shareable link, a REST API call or an MCP tool call for an AI agent.",
      inLanguage: lang,
      offers: [
        { "@type": "Offer", price: "0", priceCurrency: "EUR", name: "Free" },
        { "@type": "Offer", price: String(monthly), priceCurrency: "EUR", name: "Pro monthly" },
      ],
      featureList:
        "PNG, JPG and PDF export at 2x on Free and 4x on Pro; 18 themes; 7 code fonts; public share links with OG images; REST API; MCP server; auto language detection.",
    },
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: APP_NAME,
      url: BASE,
      logo: `${BASE}/brand/icon-512.png`,
      contactPoint: { "@type": "ContactPoint", email: "support@code2img.app", contactType: "customer support" },
    },
    faqJsonLd(faq),
  ];
}

/** The live demo, written as plain JavaScript: same pipeline, no island to hydrate. */
export function demoBlock(lang: Lang): string {
  const t = lang === "fr" ? DEMO_FR : DEMO_EN;
  const opts = (v: string) => `<option value="${v}">${v}</option>`;
  const THEME_PICK = ["github-dark", "tokyo-night", "catppuccin-latte", "rose-pine", "nord", "min-light"];
  const LANG_PICK = ["auto", "typescript", "python", "go", "rust", "sql", "shell"];
  return `<div class="demo-grid" data-stagger>
<div class="demo-controls reveal">
<label>${t.code}<textarea id="demo-code" aria-label="${t.code}" spellcheck="false">${esc(SAMPLE)}</textarea></label>
<label>${t.theme}<select id="demo-theme" aria-label="${t.theme}">${THEME_PICK.map(opts).join("")}</select></label>
<label>${t.language}<select id="demo-language" aria-label="${t.language}">${LANG_PICK.map(opts).join("")}</select></label>
<button class="btn btn-primary btn-sm" type="button" id="demo-render">${t.render}</button>
<p class="error" id="demo-error" hidden></p>
</div>
<div class="reveal">
<div class="demo-out"><img id="demo-out" src="/examples/hero.jpg" alt="${t.alt}" width="1088" height="780"></div>
<p class="demo-note">${t.note}</p>
</div>
</div>
<script>${demoJs(lang)}</script>`;
}

const SAMPLE = `// greet.ts
export function greet(name: string): string {
  return \`Hello, \${name}!\`;
}`;

const DEMO_EN = {
  code: "Code",
  theme: "Theme",
  language: "Language",
  render: "Render image",
  rendering: "Rendering…",
  failed: "render failed — try again",
  alt: "The rendered code card from the snippet above",
  note: "Real output from the render service, at 2× — the same result as the editor export.",
};
const DEMO_FR = {
  code: "Code",
  theme: "Thème",
  language: "Langage",
  render: "Rendre l'image",
  rendering: "Rendu en cours…",
  failed: "le rendu a échoué — réessayez",
  alt: "La carte de code générée à partir de l'extrait ci-dessus",
  note: "Sortie réelle du service de rendu, en 2× — le même résultat que l'export de l'éditeur.",
};

function demoJs(lang: Lang): string {
  const t = lang === "fr" ? DEMO_FR : DEMO_EN;
  return `(() => {
  var code = document.getElementById("demo-code"), theme = document.getElementById("demo-theme"),
      language = document.getElementById("demo-language"), btn = document.getElementById("demo-render"),
      out = document.getElementById("demo-out"), err = document.getElementById("demo-error");
  if (!btn) return;
  var url = null;
  btn.addEventListener("click", function () {
    btn.disabled = true; err.hidden = true; btn.textContent = ${JSON.stringify(t.rendering)};
    fetch("/api/render", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({
        config: { code: code.value, language: language.value, theme: theme.value, title: "snippet",
                  background: { type: "gradient", preset: "midnight" } },
        format: "png", scale: 2
      })
    }).then(function (res) {
      if (!res.ok) return res.json().catch(function () { return {}; }).then(function (j) {
        throw new Error(j.error || ("render failed (" + res.status + ")"));
      });
      return res.blob();
    }).then(function (blob) {
      if (url) URL.revokeObjectURL(url);
      url = URL.createObjectURL(blob); out.src = url;
      // a render keeps the card's own ratio: declare it, so the box never disagrees with the picture
      out.onload = function () { out.width = out.naturalWidth; out.height = out.naturalHeight; out.onload = null; };
    }).catch(function (e) {
      err.textContent = e.message || ${JSON.stringify(t.failed)}; err.hidden = false;
    }).then(function () {
      btn.disabled = false; btn.textContent = ${JSON.stringify(t.render)};
    });
  });
  var ta = document.getElementById("demo-code");
  ta.addEventListener("keydown", function (e) {
    if (e.key !== "Tab") return;
    e.preventDefault();
    var s = ta.selectionStart;
    ta.value = ta.value.slice(0, s) + "  " + ta.value.slice(ta.selectionEnd);
    ta.selectionStart = ta.selectionEnd = s + 2;
  });
})();`;
}

/** The billing toggle is a radio group: the annual price is in the markup, CSS picks one. */
export function priceBlock(lang: Lang, monthly: number, yearly: number): string {
  const t = lang === "fr" ? PRICE_FR : PRICE_EN;
  return `<div class="price-block"><div class="toggle">
<input type="radio" name="billing" id="billing-monthly" checked><label for="billing-monthly">${t.monthly}</label>
<input type="radio" name="billing" id="billing-yearly"><label for="billing-yearly">${t.yearly}</label>
</div><div class="plans" data-stagger>
<section class="plan reveal" aria-labelledby="plan-free"><div class="plan-head"><h3 id="plan-free">${t.free}</h3><div class="amount">0 € <span>${t.forever}</span></div></div>
<a class="btn btn-ghost btn-lg" href="/editor">${t.open}</a>
<ul>${t.freeList.map((li) => `<li>${li}</li>`).join("")}</ul></section>
<section class="plan pro reveal" aria-labelledby="plan-pro"><div class="plan-head"><h3 id="plan-pro">Pro</h3>
<div class="amount price-monthly">${monthly} € <span>${t.perMonth}</span></div>
<div class="amount price-yearly">${yearly} € <span>${t.perYear}</span></div></div>
<a class="btn btn-primary btn-lg" href="/login">${t.getPro}</a>
<ul>${t.proList.map((li) => `<li>${li}</li>`).join("")}</ul></section>
</div></div>`;
}

const PRICE_EN = {
  monthly: "Monthly",
  yearly: "Annual",
  free: "Free",
  forever: "forever",
  open: "Open the editor",
  getPro: "Get Pro",
  perMonth: "per month",
  perYear: "per year, billed once",
  freeList: [
    "PNG, JPG and PDF export up to 2×",
    `${THEMES.length} themes, ${FONTS.length} code fonts, every language Shiki knows`,
    "Public share links with an OG image",
    "10 saved presets",
    "API: 30 requests a minute, 500 a day",
    "Watermarked with code2img.app",
  ],
  proList: [
    "Export at 4× with no watermark",
    "Your own logo and background images",
    "Unlimited saved presets",
    "API: 300 requests a minute, 5.000 a day",
    "Every theme and font, for future themes too",
  ],
};
const PRICE_FR = {
  monthly: "Mensuel",
  yearly: "Annuel",
  free: "Gratuit",
  forever: "pour toujours",
  open: "Ouvrir l'éditeur",
  getPro: "Passer à Pro",
  perMonth: "par mois",
  perYear: "par an, en un paiement",
  freeList: [
    "Export PNG, JPG et PDF jusqu'à 2×",
    `${THEMES.length} thèmes, ${FONTS.length} polices de code, tous les langages connus de Shiki`,
    "Liens de partage publics avec image OG",
    "10 presets enregistrés",
    "API : 30 requêtes par minute, 500 par jour",
    "Filigrane code2img.app",
  ],
  proList: [
    "Export 4× sans filigrane",
    "Votre logo et vos images de fond",
    "Presets enregistrés illimités",
    "API : 300 requêtes par minute, 5 000 par jour",
    "Tous les thèmes et polices, y compris les futurs",
  ],
};

export const COUNTS = { themes: THEMES.length, fonts: FONTS.length, languages: DETECTED_LANGUAGES.length };
export const PRICES = {
  monthly: Number(process.env.PRICE_PRO_MONTHLY_EUR ?? 3),
  yearly: Number(process.env.PRICE_PRO_YEARLY_EUR ?? 29),
};
