// Marketing pages are plain HTML documents served by route handlers: no React runtime on the
// critical path, one inline stylesheet, one small inline script. The editor, dashboard and share
// pages stay React. The landing used to ship 33 KB of Next flight data and six JS chunks; a phone
// paid for all of it before the first paint.
import { readFileSync } from "node:fs";
import path from "node:path";
import { APP_NAME, APP_URL, FONTS, LANGUAGES, THEMES } from "@code2img/shared";
import { REVEAL_JS } from "../reveal";

export type Lang = "en" | "fr";
export const BASE = APP_URL;

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
  cssCache ??= ["app/tokens.css", "app/globals.css", "app/landing.css"].map(readFile).join("\n");
  return cssCache;
}

const contentCache = new Map<string, string>();
/** A content fragment: content/<name>.html, hand-written HTML (no markdown step, no dependency).
 *  Every block gets data-reveal, so prose enters the way the other sections do. */
export function content(name: string): string {
  const hit = contentCache.get(name);
  if (hit !== undefined) return hit;
  const html = readFile(`content/${name}.html`)
    .replace(/<!--\s*@lang:(fr|en)\s*-->/g, "")
    .replace(/<(h2|h3|p|ul|ol|pre|figure|table)(\s|>)/g, "<$1 data-reveal$2");
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

export function nav(lang: Lang, active = ""): string {
  const t = NAV[lang];
  const p = (href: string, label: string) =>
    `<a href="${href}"${active === href ? ' aria-current="page"' : ""}>${label}</a>`;
  const other = lang === "fr" ? { href: "/", label: "EN" } : { href: "/fr", label: "FR" };
  const prefix = lang === "fr" ? "/fr" : "";
  return `<header class="mk-nav"><div class="mk-wrap">${wordmark(lang)}<nav class="mk-links" aria-label="${t.main}">${p(
    `${prefix}/#features`,
    t.features,
  )}${p(`${prefix}/pricing`, t.pricing)}${p("/docs", t.api)}${p("/mcp", t.mcp)}${p("/blog", t.blog)}<a class="lang" href="${other.href}" hreflang="${other.label.toLowerCase()}" lang="${other.label.toLowerCase()}">${other.label}</a><a class="btn btn-primary btn-lg" href="/editor">${t.cta}</a></nav></div></header>`;
}

export function footer(lang: Lang): string {
  const t = NAV[lang];
  const prefix = lang === "fr" ? "/fr" : "";
  return `<footer class="mk-foot"><div class="mk-wrap"><p class="big">Code2Img</p><div class="cols">
<nav aria-label="${t.product}"><a href="/editor">${t.editor}</a><a href="${prefix}/pricing">${t.pricing}</a><a href="/dashboard">${t.dashboard}</a><a href="/blog">${t.blog}</a><a href="/changelog">${t.changelog}</a></nav>
<nav aria-label="${t.developers}"><a href="/docs">${t.apiRef}</a><a href="/mcp">MCP server</a><a href="/api/v1/openapi.json">OpenAPI spec</a><a href="/llms.txt">llms.txt</a></nav>
<nav aria-label="${t.legalHeading}"><a href="/legal/terms">${t.terms}</a><a href="/legal/privacy">${t.privacy}</a><a href="mailto:hello@code2img.app">hello@code2img.app</a><a href="mailto:support@code2img.app">support@code2img.app</a></nav>
</div><p class="legal">© ${new Date().getFullYear()} ${APP_NAME}. ${t.independent}</p></div></footer>`;
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
  legalHeading: string;
  terms: string;
  privacy: string;
  independent: string;
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
    legalHeading: "Contact and legal",
    terms: "Terms",
    privacy: "Privacy",
    independent: "An independent product, not affiliated with any other screenshot tool.",
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
    legalHeading: "Contact et mentions",
    terms: "Conditions",
    privacy: "Confidentialité",
    independent: "Un produit indépendant, sans lien avec un autre outil de capture de code.",
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
<meta name="twitter:image" content="${og.startsWith("http") ? og : BASE + og}">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="icon" href="/brand/favicon-32.png" sizes="32x32">
<link rel="apple-touch-icon" href="/brand/apple-touch-icon.png">
<link rel="manifest" href="/manifest.webmanifest">
${ld}
${meta.preload ? `<link rel="preload" as="image" href="${meta.preload}" fetchpriority="high">` : ""}
<style>${siteCss()}</style>
</head>
<body class="mk">
${body}
<script>${REVEAL_JS}</script>
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
  return `<div class="faq">${items
    .map((f) => `<details data-reveal><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`)
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
          ? "Transformez un extrait de code en image nette, en lien partageable, en API et en serveur MCP pour agents IA."
          : "Turn code snippets into pixel-perfect images, shareable links, an API and an MCP server for AI agents.",
      inLanguage: lang,
      offers: [
        { "@type": "Offer", price: "0", priceCurrency: "EUR", name: "Free" },
        { "@type": "Offer", price: String(monthly), priceCurrency: "EUR", name: "Pro monthly" },
      ],
      featureList:
        "PNG, JPG and PDF export up to 4x; 18 themes; 7 code fonts; public share links with OG images; REST API; MCP server; auto language detection.",
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
  return `<div class="demo-grid">
<div class="demo-controls">
<label>${t.code}<textarea id="demo-code" aria-label="${t.code}" spellcheck="false">${esc(SAMPLE)}</textarea></label>
<label>${t.theme}<select id="demo-theme" aria-label="${t.theme}">${THEME_PICK.map(opts).join("")}</select></label>
<label>${t.language}<select id="demo-language" aria-label="${t.language}">${LANG_PICK.map(opts).join("")}</select></label>
<button class="btn btn-primary" type="button" id="demo-render">${t.render}</button>
<p class="error" id="demo-error" hidden></p>
</div>
<div>
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
</div><div class="plans">
<section class="plan" aria-labelledby="plan-free"><div class="plan-head"><h3 id="plan-free">${t.free}</h3><div class="amount">0 € <span>${t.forever}</span></div></div>
<a class="btn btn-primary btn-lg" href="/editor">${t.open}</a>
<ul>${t.freeList.map((li) => `<li>${li}</li>`).join("")}</ul></section>
<section class="plan pro" aria-labelledby="plan-pro"><div class="plan-head"><h3 id="plan-pro">Pro</h3>
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

export const COUNTS = { themes: THEMES.length, fonts: FONTS.length, languages: LANGUAGES.length };
export const PRICES = {
  monthly: Number(process.env.PRICE_PRO_MONTHLY_EUR ?? 7),
  yearly: Number(process.env.PRICE_PRO_YEARLY_EUR ?? 59),
};
