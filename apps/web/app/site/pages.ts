// The marketing pages, as fragments of real HTML. Each builder is called by a one-line route
// handler; the shell wraps it with the head, the nav and the footer.
import {
  BASE,
  COUNTS,
  PRICES,
  breadcrumbs,
  content,
  demoBlock,
  doc,
  esc,
  faqBlock,
  faqJsonLd,
  footer,
  homeJsonLd,
  nav,
  priceBlock,
  type Lang,
  type Meta,
} from "./shell";
import { FAQ_EN, FAQ_FR } from "./faq";

function faq(lang: Lang) {
  return lang === "fr" ? FAQ_FR : FAQ_EN;
}

const GALLERY = [
  { file: "theme-tokyo-night", theme: "tokyo-night", title: "deploy.sh" },
  { file: "theme-catppuccin-latte", theme: "catppuccin-latte", title: "App.tsx" },
  { file: "theme-rose-pine", theme: "rose-pine", title: "query.sql" },
  { file: "theme-nord", theme: "nord", title: "main.go" },
  { file: "theme-dracula", theme: "dracula", title: "train.py" },
  { file: "theme-min-light", theme: "min-light", title: "notes.rs" },
];

const apiSnippet = `curl -X POST ${BASE}/api/v1/images \\
  -H "Authorization: Bearer ***" \\
  -H "content-type: application/json" \\
  -d '{"config":{
        "code":"print(\\"hi\\")",
        "language":"python",
        "theme":"tokyo-night"}}' \\
  --output card.png`;

const mcpSnippet = `{
  "mcpServers": {
    "code2img": {
      "type": "http",
      "url": "${BASE}/mcp",
      "headers": { "Authorization": "Bearer c2i_sk_…" }
    }
  }
}`;

/* ————————————————————————————————————————————— landing ————————————— */

const HOME = {
  en: {
    title: "Code to image — paste a snippet, export a PNG | Code2Img",
    description:
      "Code to image in the browser: paste a snippet, pick a theme, export PNG, JPG or PDF at up to 4×, or render it from the REST API or an MCP server.",
    h1: "Code to image.",
    lead: "Paste a snippet, choose a theme, export PNG, JPG or PDF. No account required.",
    aud: ["From a script: one POST returns the PNG.", "From an agent: one MCP tool call renders it."],
    cta: "Open the editor",
    cta2: "See pricing",
    shot: "cart.ts, github-dark, exported at 2× from the editor.",
    shotAlt: "A rendered code card: the file cart.ts in the github-dark theme on a midnight gradient, with macOS window controls and a line-number gutter",
    demoH2: "Render one right here.",
    demoP:
      "This box is the real pipeline, not a picture: your snippet goes to the render service and comes back as a PNG, with the watermark the Free plan carries.",
    galH2: (t: number, f: number) => `${t} themes, ${f} code fonts, every export.`,
    galP: "Six of them, rendered by the product itself at 2×.",
    featH2: "Built for the way code gets shared.",
    feats: [
      {
        h: "Share links that preview properly",
        p: "Every export can become a public page with its own OG image, so a pasted link shows the card in X, LinkedIn, Slack and Farcaster. Links expire on your terms and can be deleted.",
      },
      {
        h: "Exports that survive a slide and a retina screen",
        p: "PNG, JPG and PDF up to 2× on Free and 4× on Pro, with the layout you set: padding, radius, window chrome, a fixed or automatic width, and 1:1, 16:9, 4:5 or an OG crop.",
      },
      {
        h: "One pipeline, three ways in",
        p: "The editor, the REST API and the MCP server all call the same service. What you see in the preview is what a client gets back — the same themes, the same limits.",
      },
      {
        h: "Backgrounds and branding",
        p: "Gradients, mesh, patterns, a flat colour or your own image, plus a logo in the card corner on Pro. The watermark disappears when you pay for it.",
      },
    ],
    devH2: "An endpoint, and an MCP server.",
    devP: (n: number) =>
      `${n} languages are recognised automatically. Send a config, get bytes back; the same call is available to an agent over MCP.`,
    devR: "REST — one request, one PNG",
    devM: "MCP — remote Streamable HTTP",
    devTail:
      'Keys carry scopes and quotas; signed URLs let a browser fetch a render without the key. The OpenAPI spec is at <a href="/api/v1/openapi.json">/api/v1/openapi.json</a>; setup notes are in the <a href="/docs">API reference</a> and on the <a href="/mcp">MCP page</a>.',
    priceH2: (m: number) => `Free to use. Pro is ${m}\u00a0€\u00a0a\u00a0month.`,
    priceP: "Paid on Stripe and cancellable from the dashboard; the Free plan needs no card.",
    faqH2: "Questions people actually ask.",
    closeH2: "One snippet away.",
    closeP: "No account, no card: open the editor and export the first card in under a minute.",
    featAlt: "A code card for query.sql rendered in the rose-pine theme on a dark background",
  },
  fr: {
    title: "Code en image : transformez un extrait en PNG | Code2Img",
    description:
      "Transformez du code en image dans le navigateur : collez un extrait, choisissez un thème, exportez en PNG, JPG ou PDF, ou passez par l'API REST et le serveur MCP.",
    h1: "Du code à l'image.",
    lead: "Collez un extrait, choisissez un thème, exportez en PNG, JPG ou PDF. Aucun compte requis.",
    aud: ["Depuis un script : un POST renvoie le PNG.", "Depuis un agent : un appel MCP le rend."],
    cta: "Ouvrir l'éditeur",
    cta2: "Voir les tarifs",
    shot: "cart.ts, thème github-dark, exporté en 2× depuis l'éditeur.",
    shotAlt:
      "Une carte de code générée : le fichier cart.ts en thème github-dark sur un dégradé nuit, avec les contrôles de fenêtre macOS et la gouttière de numéros de ligne",
    demoH2: "Générez-en une, ici même.",
    demoP:
      "Cette zone est le vrai moteur, pas une capture : votre extrait part au service de rendu et revient en PNG, avec le filigrane du plan gratuit.",
    galH2: (t: number, f: number) => `${t} thèmes, ${f} polices, tous les formats.`,
    galP: "Six d'entre eux, générés par le produit lui-même en 2×.",
    featH2: "Fait pour partager du code.",
    feats: [
      {
        h: "Des liens qui s'affichent correctement",
        p: "Chaque export peut devenir une page publique avec sa propre image OG : un lien collé montre la carte sur X, LinkedIn, Slack et Farcaster. Les liens expirent quand vous le décidez et peuvent être supprimés.",
      },
      {
        h: "Des exports qui tiennent en diapositive et sur un écran retina",
        p: "PNG, JPG et PDF jusqu'à 2× en gratuit et 4× en Pro, avec la mise en page que vous réglez : padding, rayon, barre de fenêtre, largeur fixe ou automatique, et 1:1, 16:9, 4:5 ou un cadrage OG.",
      },
      {
        h: "Un seul moteur de rendu, trois entrées",
        p: "L'éditeur, l'API REST et le serveur MCP appellent le même service. Ce que vous voyez dans l'aperçu est ce qu'un client reçoit : les mêmes thèmes, les mêmes limites.",
      },
      {
        h: "Fonds et image de marque",
        p: "Dégradés, mesh, motifs, une couleur unie ou votre propre image, plus un logo dans le coin de la carte avec Pro. Le filigrane disparaît quand vous payez.",
      },
    ],
    devH2: "Un endpoint, et un serveur MCP.",
    devP: (n: number) =>
      `${n} langages sont reconnus automatiquement. Envoyez une configuration, recevez des octets ; le même appel est disponible pour un agent via MCP.`,
    devR: "REST — une requête, un PNG",
    devM: "MCP — Streamable HTTP distant",
    devTail:
      `Les clés portent des scopes et des quotas ; les URLs signées permettent à un navigateur de récupérer un rendu sans la clé. La spécification OpenAPI est sur <a href="/api/v1/openapi.json">/api/v1/openapi.json</a> ; les notes d'installation sont dans la <a href="/docs">référence API</a> et sur la <a href="/mcp">page MCP</a>.`,
    priceH2: (m: number) => `Gratuit. Pro à ${m}\u00a0€\u00a0par\u00a0mois.`,
    priceP: "Paiement par Stripe, résiliable depuis le tableau de bord ; le plan gratuit ne demande aucune carte.",
    faqH2: "Les questions qui reviennent.",
    closeH2: "Il ne manque qu'un extrait.",
    closeP: "Ni compte ni carte : ouvrez l'éditeur et exportez la première carte en moins d'une minute.",
    featAlt: "Une carte de code pour query.sql en thème rose-pine sur fond sombre",
  },
};

export function home(lang: Lang): string {
  const t = HOME[lang];
  const m = PRICES.monthly;
  const path = lang === "fr" ? "/fr" : "/";
  const body = `<section class="mk-hero"><div class="mk-wrap">
<div class="mk-hero-top">
<h1>${t.h1}</h1>
<div><p class="mk-lead">${t.lead}</p>
<ul class="mk-aud">${t.aud.map((a) => `<li>${a}</li>`).join("")}</ul>
<div class="mk-actions"><a class="btn btn-primary btn-lg" href="/editor">${t.cta}</a><a class="btn btn-lg" href="/pricing">${t.cta2}</a></div></div>
</div>
<figure class="mk-shot">
<img src="/examples/hero.jpg" srcset="/examples/hero-sm.jpg 544w, /examples/hero.jpg 1088w" sizes="(max-width: 760px) 92vw, 800px" alt="${t.shotAlt}" width="1088" height="780" fetchpriority="high" decoding="async">
<figcaption>${t.shot}</figcaption>
</figure>
</div></section>

<section class="mk-demo mk-sec"><div class="mk-wrap" data-reveal-group>
<div><h2 data-reveal>${t.demoH2}</h2><p class="tight" data-reveal>${t.demoP}</p></div>
<div data-reveal>${demoBlock(lang)}</div>
</div></section>

<section class="mk-sec" id="examples"><div class="mk-wrap" data-reveal-group>
<h2 data-reveal>${t.galH2(COUNTS.themes, COUNTS.fonts)}</h2>
<p class="tight" data-reveal>${t.galP}</p>
<div class="gal" style="margin-top:var(--s5)">${GALLERY.map(
    (g) =>
      `<figure data-reveal><img src="/examples/${g.file}.jpg" alt="${lang === "fr" ? "Carte de code générée dans le thème" : "Code card rendered in the"} ${g.theme}${lang === "fr" ? " : " : " theme: "}${g.title}" width="1200" height="675" loading="lazy" decoding="async"><figcaption>${g.theme} · ${g.title}</figcaption></figure>`,
  ).join("")}</div>
</div></section>

<section class="mk-sec" id="features"><div class="mk-wrap feat" data-reveal-group>
<div><h2 data-reveal>${t.featH2}</h2><ul class="feat-list">${t.feats
    .map((f) => `<li data-reveal><h3>${f.h}</h3><p>${f.p}</p></li>`)
    .join("")}</ul></div>
<div data-reveal><img src="/examples/example-rose.jpg" alt="${t.featAlt}" width="2560" height="1440" loading="lazy" decoding="async" style="width:100%;height:auto;border-radius:var(--r-panel)"></div>
</div></section>

<section class="mk-sec dev" id="developers"><div class="mk-wrap" data-reveal-group>
<h2 data-reveal>${t.devH2}</h2>
<p class="tight" data-reveal>${t.devP(COUNTS.languages)}</p>
<div class="dev-grid" style="margin-top:var(--s5)">
<div data-reveal><p class="cap">${t.devR}</p><pre><code>${esc(apiSnippet)}</code></pre></div>
<div data-reveal><p class="cap">${t.devM}</p><pre><code>${esc(mcpSnippet)}</code></pre></div>
</div>
<p class="tight" data-reveal style="margin-top:var(--s4)">${t.devTail}</p>
</div></section>

<section class="mk-sec" id="pricing"><div class="mk-wrap" data-reveal-group>
<div class="price-head"><h2 data-reveal style="margin:0">${t.priceH2(m)}</h2></div>
<div data-reveal style="margin-top:var(--s5)">${priceBlock(lang, PRICES.monthly, PRICES.yearly)}</div>
<p class="tight" data-reveal style="margin-top:var(--s4)">${t.priceP}</p>
</div></section>

<section class="mk-sec" id="faq"><div class="mk-wrap" data-reveal-group>
<div class="faq-grid"><h2 data-reveal>${t.faqH2}</h2>${faqBlock(faq(lang))}</div>
</div></section>

<section class="mk-sec" style="background:var(--surface)"><div class="mk-wrap" data-reveal-group>
<h2 data-reveal>${t.closeH2}</h2>
<p class="tight" data-reveal>${t.closeP}</p>
<div class="mk-actions" data-reveal style="margin-top:var(--s4)"><a class="btn btn-primary btn-lg" href="/editor">${t.cta}</a><a class="btn btn-lg" href="/pricing">${t.cta2}</a></div>
</div></section>`;

  const meta: Meta = {
    title: t.title,
    description: t.description,
    path,
    lang,
    alt: lang === "fr" ? "/" : "/fr",
    jsonLd: homeJsonLd(lang, m, faq(lang)),
    preload: "/examples/hero.jpg",
  };
  return doc(meta, `${nav(lang, path)}${body}${footer(lang)}`);
}

/* ————————————————————————————————————————————— pricing ————————————— */

const PRICING = {
  en: {
    title: "Pricing — free to use, Pro removes the watermark | Code2Img",
    description:
      "The Code2Img editor is free. Pro removes the watermark, raises exports to 4×, adds your logo and your own background, and lifts the API quota.",
    h1: "One price, no tiers.",
    lead: (m: number, y: number) =>
      `The editor is free and stays free. Pro is ${m} € a month — or ${y} € a year — and changes four things: the watermark, the export scale, your own branding, and the API quota.`,
  },
  fr: {
    title: "Tarifs — gratuit, Pro retire le filigrane | Code2Img",
    description:
      "L'éditeur Code2Img est gratuit. Pro retire le filigrane, monte les exports à 4×, ajoute votre logo et votre propre fond, et relève le quota d'API.",
    h1: "Un seul prix, pas de paliers.",
    lead: (m: number, y: number) =>
      `L'éditeur est gratuit et le reste. Pro coûte ${m} € par mois — ou ${y} € par an — et change quatre choses : le filigrane, l'échelle d'export, votre image de marque et le quota d'API.`,
  },
};

const ROWS = [
  { label: "Export formats", labelFr: "Formats d'export", free: "PNG, JPG, PDF, WebM", pro: "PNG, JPG, PDF, WebM, MP4" },
  { label: "Export scale", labelFr: "Échelle d'export", free: "up to 2×", pro: "up to 4×" },
  { label: "Watermark", labelFr: "Filigrane", free: "code2img.app", pro: "none" },
  { label: "Themes and fonts", labelFr: "Thèmes et polices", free: "all", pro: "all" },
  { label: "Backgrounds", labelFr: "Fonds", free: "gradients, mesh, patterns, solid", pro: "+ your own image" },
  { label: "Logo in the card corner", labelFr: "Logo dans le coin de la carte", free: "no", pro: "yes" },
  { label: "Saved presets", labelFr: "Presets enregistrés", free: "10", pro: "unlimited" },
  { label: "Share links with OG image", labelFr: "Liens de partage avec image OG", free: "yes", pro: "yes" },
  { label: "REST API", labelFr: "API REST", free: "30 a minute, 500 a day", pro: "300 a minute, 5.000 a day" },
  { label: "MCP server (remote and stdio)", labelFr: "Serveur MCP (distant et stdio)", free: "yes", pro: "yes" },
];

export function pricingPage(lang: Lang): string {
  const t = PRICING[lang];
  const fr = lang === "fr";
  const path = fr ? "/fr/pricing" : "/pricing";
  const labels = fr
    ? {
        h2Strip: "La même carte, trois versions.",
        pStrip:
          "Le plan gratuit exporte cette carte jusqu'à 2× avec un petit filigrane ; Pro retire le filigrane et monte à 4×. Tout le reste — thèmes, polices, fonds, liens de partage — est dans les deux plans.",
        h2Plans: "Choisissez un plan.",
        h2Table: "Ce qui change entre les deux.",
        h2Faq: "Les questions sur le paiement.",
        free: "Gratuit",
        pro: "Pro",
      }
    : {
        h2Strip: "The same card, three ways.",
        pStrip:
          "Free exports this card at up to 2× with a small watermark; Pro removes the watermark and goes to 4×. Everything else — themes, fonts, backgrounds, share links — is in both plans.",
        h2Plans: "Pick a plan.",
        h2Table: "What changes between the two.",
        h2Faq: "Questions about paying.",
        free: "Free",
        pro: "Pro",
      };
  const body = `<section class="mk-hero"><div class="mk-wrap" data-reveal-group>
<div class="mk-hero-top"><h1 data-reveal>${t.h1}</h1><p class="mk-lead" data-reveal>${t.lead(PRICES.monthly, PRICES.yearly)}</p></div>
</div></section>

<section class="mk-sec" aria-labelledby="strip" style="padding-top:0"><div class="mk-wrap" data-reveal-group>
<h2 id="strip" data-reveal>${labels.h2Strip}</h2>
<p class="tight" data-reveal style="margin-top:var(--s3)">${labels.pStrip}</p>

</div></section>

<section class="mk-sec"><div class="mk-wrap" data-reveal-group>
<h2 data-reveal>${labels.h2Plans}</h2>
<div data-reveal style="margin-top:var(--s4)">${priceBlock(lang, PRICES.monthly, PRICES.yearly)}</div>
<div data-reveal style="margin-top:var(--gap-section)">
<h2>${labels.h2Table}</h2>
<table class="cmp" style="margin-top:var(--s4)">
<thead><tr><th> </th><th>${labels.free}</th><th>${labels.pro}</th></tr></thead>
<tbody>${ROWS.map(
      (r) =>
        `<tr><th scope="row">${fr ? r.labelFr : r.label}</th><td>${fr ? frVal(r.free) : r.free}</td><td>${fr ? frVal(r.pro) : r.pro}</td></tr>`,
    ).join("")}</tbody></table>
</div>
</div></section>

<section class="mk-sec" style="background:var(--surface)"><div class="mk-wrap faq-grid" data-reveal-group>
<h2 data-reveal>${labels.h2Faq}</h2>${faqBlock(faq(lang))}
</div></section>`;

  const meta: Meta = {
    title: t.title,
    description: t.description,
    path,
    lang,
    alt: fr ? "/pricing" : "/fr/pricing",
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        name: "Code2Img",
        applicationCategory: "DeveloperApplication",
        operatingSystem: "Web",
        url: `${BASE}${path}`,
        offers: [
          { "@type": "Offer", price: "0", priceCurrency: "EUR", name: "Free" },
          { "@type": "Offer", price: String(PRICES.monthly), priceCurrency: "EUR", name: "Pro monthly" },
          { "@type": "Offer", price: String(PRICES.yearly), priceCurrency: "EUR", name: "Pro annual" },
        ],
      },
      faqJsonLd(faq(lang)),
      breadcrumbs(
        [
          { name: fr ? "Accueil" : "Home", path: fr ? "/fr" : "/" },
          { name: fr ? "Tarifs" : "Pricing", path },
        ],
        lang,
      ),
    ],
  };
  return doc(meta, `${nav(lang, path)}${body}${footer(lang)}`);
}

function frVal(v: string): string {
  const map: Record<string, string> = {
    "up to 2×": "jusqu'à 2×",
    "up to 4×": "jusqu'à 4×",
    none: "aucun",
    all: "tous",
    "gradients, mesh, patterns, solid": "dégradés, mesh, motifs, uni",
    "+ your own image": "+ votre image",
    no: "non",
    yes: "oui",
    unlimited: "illimités",
    "30 a minute, 500 a day": "30 par minute, 500 par jour",
    "300 a minute, 5.000 a day": "300 par minute, 5 000 par jour",
  };
  return map[v] ?? v;
}

/* ——————————————————————————————————————— /api, blog, changelog, legal ——————— */

export interface DocPage {
  slug: string;
  title: string;
  h1: string;
  description: string;
  /** path on the site */
  path: string;
  file: string;
  updated: string;
  lang: Lang;
  /** false for documents where a picture band would be noise (the legal pages) */
  pictures?: boolean;
  band?: string;
}

export const BLOG_POSTS: DocPage[] = [
  {
    slug: "how-code2img-renders-a-card",
    title: "How Code2Img turns a snippet into a PNG — Code2Img",
    h1: "How a snippet becomes a PNG",
    description:
      "The pipeline behind every export: Shiki highlighting, a sandboxed browser, deviceScaleFactor for the 2× and 4× scales, and why the preview and the download are the same document.",
    path: "/blog/how-code2img-renders-a-card",
    file: "blog/how-code2img-renders-a-card",
    updated: "2026-11-15",
    lang: "en",
  },
  {
    slug: "auto-detecting-the-language-of-a-snippet",
    title: "Auto-detecting a snippet's language — Code2Img",
    h1: "How auto-detection works",
    description:
      "Auto-detection is a short ordered list of regexes with one fallback. Here is the real order, the two collisions that surprise people, and when to set the language yourself.",
    path: "/blog/auto-detecting-the-language-of-a-snippet",
    file: "blog/auto-detecting-the-language-of-a-snippet",
    updated: "2026-11-15",
    lang: "en",
  },
];

export const LANGUAGES: { slug: string; name: string }[] = [
  { slug: "typescript", name: "TypeScript" },
  { slug: "python", name: "Python" },
  { slug: "go", name: "Go" },
  { slug: "rust", name: "Rust" },
  { slug: "sql", name: "SQL" },
  { slug: "shell", name: "Bash" },
  { slug: "java", name: "Java" },
  { slug: "csharp", name: "C#" },
  { slug: "php", name: "PHP" },
  { slug: "ruby", name: "Ruby" },
];

/** A band of real renders, captioned. The product's own output is the honest picture on a
 * documentation page — and it is what the pictures floor is measuring. */
export function renderBand(caption: string): string {
  // width/height are the real pixels gen-assets.mjs writes: a wrong pair makes the browser reserve
  // the wrong box before the picture arrives (Lighthouse: image-aspect-ratio).
  const shots = [
    { file: "hero", cap: "cart.ts · github-dark", w: 1088, h: 780 },
    { file: "example-tokyo", cap: "deploy.sh · tokyo-night", w: 1032, h: 732 },
    { file: "example-dracula", cap: "train.py · dracula", w: 1232, h: 636 },
    { file: "example-min", cap: "notes.rs · min-light", w: 760, h: 636 },
  ];
  return `<section class="mk-sec" style="padding-block:var(--gap-section)"><div class="mk-wrap" data-reveal-group>
<h2 data-reveal>${caption}</h2>
<div class="mk-strip" data-reveal>${shots
    .map(
      (s) =>
        `<figure><figcaption>${esc(s.cap)}</figcaption><img src="/examples/${s.file}.jpg" alt="A code card rendered by Code2Img: ${esc(s.cap)}" width="${s.w}" height="${s.h}" loading="lazy" decoding="async"></figure>`,
    )
    .join("")}</div>
</div></section>`;
}

export function docPage(p: DocPage, extraJsonLd?: unknown[]): string {
  const meta: Meta = {
    title: p.title,
    description: p.description,
    path: p.path,
    lang: p.lang,
    jsonLd: [
      ...(extraJsonLd ?? []),
      breadcrumbs(
        [
          { name: "Home", path: "/" },
          { name: p.h1, path: p.path },
        ],
        p.lang,
      ),
    ],
  };
  const body = `<section class="mk-hero"><div class="mk-wrap">
<h1 data-reveal>${p.h1}</h1><p class="mk-lead" data-reveal style="max-width:60ch">${p.description}</p>
</div></section>
${p.pictures === true ? renderBand(p.band ?? "Rendered by Code2Img, at 2×.") : ""}
<section class="mk-sec" style="padding-top:0"><div class="mk-wrap prose" data-reveal-group><div data-reveal>${content(p.file)}</div></div></section>`;
  return doc(meta, `${nav(p.lang, "")}${body}${footer(p.lang)}`);
}

/** /api — the reference page. The prose lives in content/api.html. */
export function apiPage(): string {
  return docPage({
    slug: "api",
    title: "API — render a code image over HTTP | Code2Img",
    h1: "Your code, over HTTP.",
    description:
      "Code2Img's REST API turns a JSON config into a code image: PNG, JPG or PDF at up to 4×. Keys, scopes, quotas, signed URLs, the OpenAPI spec and the TypeScript SDK.",
    path: "/api",
    file: "api",
    updated: "2026-11-15",
    lang: "en",
    band: "What the API returns, four times over.",
  });
}

export function blogPost(slug: string): string | null {
  const p = BLOG_POSTS.find((b) => b.slug === slug);
  if (!p) return null;
  return docPage(p, [
    {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: p.h1,
      description: p.description,
      datePublished: p.updated,
      dateModified: p.updated,
      mainEntityOfPage: `${BASE}${p.path}`,
      author: { "@type": "Organization", name: "Code2Img", url: BASE },
      publisher: { "@type": "Organization", name: "Code2Img", logo: { "@type": "ImageObject", url: `${BASE}/brand/icon-512.png` } },
    },
  ]);
}

/** "2026-11-15" → "15 November 2026": a date a reader reads, not a sortable key. */
export function longDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}

export function blogIndex(): string {
  const meta: Meta = {
    title: "Blog — Code2Img",
    description: "Notes from building Code2Img: the render pipeline, themes, code screenshots that stay readable, and rendering from an AI agent.",
    path: "/blog",
    lang: "en",
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "Blog",
        name: "Code2Img blog",
        url: `${BASE}/blog`,
        blogPost: BLOG_POSTS.map((p) => ({
          "@type": "BlogPosting",
          headline: p.h1,
          url: `${BASE}${p.path}`,
          datePublished: p.updated,
          description: p.description,
        })),
      },
      breadcrumbs([{ name: "Home", path: "/" }, { name: "Blog", path: "/blog" }], "en"),
    ],
  };
  const body = `<section class="mk-hero"><div class="mk-wrap">
<h1 data-reveal>Notes from the build.</h1>
<p class="mk-lead" data-reveal style="max-width:58ch">How the render pipeline works, what makes a code card readable, and how to get a picture out of an agent. Short pieces, each one grounded in the shipped code.</p>
</div></section>
<section class="mk-sec" style="padding-top:0"><div class="mk-wrap"><ul class="posts" data-reveal-group>${BLOG_POSTS.map(
    (p) =>
      `<li data-reveal><h2 data-reveal><a href="${p.path}">${p.h1}</a></h2><p data-reveal class="byline"><time datetime="${p.updated}">${longDate(p.updated)}</time> · ${readingMinutes(p.file)} min read</p><p data-reveal>${p.description}</p></li>`,
  ).join("")}</ul></div></section>`;
  return doc(meta, `${nav("en", "")}${body}${footer("en")}`);
}

function readingMinutes(file: string): number {
  const words = content(file).replace(/<[^>]+>/g, " ").split(/\s+/).length;
  return Math.max(1, Math.round(words / 220));
}

export function languagePage(slug: string): string | null {
  const entry = LANGUAGES.find((l) => l.slug === slug);
  if (!entry) return null;
  const path = `/code-screenshot/${slug}`;
  const title = `${entry.name} code screenshot — render a ${entry.name} snippet as an image`;
  const h1 = `${entry.name} code screenshots.`;
  const description = `How to screenshot ${entry.name} code properly: what ${entry.name} snippets actually look like, how auto-detection behaves, the theme that reads best, and the settings that keep the card legible.`;
  const meta: Meta = {
    title: `${title} — Code2Img`,
    description,
    path,
    lang: "en",
    ogImage: `/api/og?title=${encodeURIComponent(`${entry.name} code screenshot`)}&sub=${encodeURIComponent("code2img.app")}`,
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "HowTo",
        name: `Screenshot a ${entry.name} snippet as an image`,
        description,
        totalTime: "PT1M",
        tool: [{ "@type": "HowToTool", name: "Code2Img editor or API" }],
        step: [
          { "@type": "HowToStep", name: "Paste the snippet", text: `Open the editor at ${BASE}/editor and paste your ${entry.name} code.` },
          { "@type": "HowToStep", name: "Pick the theme and font", text: "Choose a theme that keeps keywords and types distinguishable, and a font size that keeps the longest line inside the card." },
          { "@type": "HowToStep", name: "Export", text: "Export PNG, JPG or PDF at 2× (Free) or 4× (Pro), or render it from the API." },
        ],
      },
      breadcrumbs([{ name: "Home", path: "/" }, { name: title, path }], "en"),
    ],
  };
  const others = LANGUAGES.filter((l) => l.slug !== slug);
  const body = `<section class="mk-hero"><div class="mk-wrap">
<h1 data-reveal>${h1}</h1>
<p class="mk-lead" data-reveal style="max-width:60ch">${description}</p>
<div class="mk-actions" data-reveal style="margin-top:var(--s4)"><a class="btn btn-primary btn-lg" href="/editor">Open the editor</a><a class="btn btn-lg" href="/docs">API docs</a></div>
</div></section>
<section class="mk-sec" style="padding-top:0"><div class="mk-wrap prose" data-reveal-group><div data-reveal>${content(`languages/${slug}`)}</div></div></section>
<section class="mk-sec" style="background:var(--surface)"><div class="mk-wrap">
<h2>Other languages</h2>
<p class="tight">The same advice, for the languages people paste most.</p>
<ul class="langs" style="margin-top:var(--s4)">${others
    .map((l) => `<li><a href="/code-screenshot/${l.slug}">${l.name}</a></li>`)
    .join("")}</ul>
</div></section>`;
  return doc(meta, `${nav("en", "")}${body}${footer("en")}`);
}

export interface Comparison {
  slug: string;
  title: string;
  h1: string;
  description: string;
  file: string;
  path: string;
}

export const VS: Comparison[] = [
  {
    slug: "ray-so",
    title: "Code2Img vs ray.so — Code2Img",
    h1: "Code2Img and ray.so",
    description:
      "Both turn a snippet into a picture. ray.so is a fast, beautiful one-off export; Code2Img adds the parts you need when the image has to come from a script, an API or an agent.",
    file: "vs/ray-so",
    path: "/vs/ray-so",
  },
  {
    slug: "carbon",
    title: "Code2Img vs Carbon — Code2Img",
    h1: "Code2Img and Carbon",
    description:
      "Carbon made the code screenshot a genre. Code2Img is that idea with an API, share pages, an MCP server and exports up to 4× built in.",
    file: "vs/carbon",
    path: "/vs/carbon",
  },
  {
    slug: "snappify",
    title: "Code2Img vs Snappify — Code2Img",
    h1: "Code2Img and Snappify",
    description:
      "Snappify builds presentations and animated walkthroughs around code. Code2Img stays narrower: one snippet, one image, from the editor, the API or an agent.",
    file: "vs/snappify",
    path: "/vs/snappify",
  },
];

export function comparisonPage(slug: string): string | null {
  const c = VS.find((v) => v.slug === slug);
  if (!c) return null;
  const meta: Meta = {
    title: c.title,
    description: c.description,
    path: c.path,
    lang: "en",
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: c.title,
        description: c.description,
        url: `${BASE}${c.path}`,
        about: { "@type": "SoftwareApplication", name: "Code2Img", applicationCategory: "DeveloperApplication" },
      },
      breadcrumbs([{ name: "Home", path: "/" }, { name: c.h1, path: c.path }], "en"),
    ],
  };
  const body = `<section class="mk-hero"><div class="mk-wrap">
<h1 data-reveal>${c.h1}</h1><p class="mk-lead" data-reveal style="max-width:60ch">${c.description}</p>
</div></section>
<section class="mk-sec" style="padding-top:0"><div class="mk-wrap prose" data-reveal-group><div data-reveal>${content(c.file)}</div></div></section>
<section class="mk-sec" style="background:var(--surface)"><div class="mk-wrap">
<h2>Try it on a snippet you have open.</h2>
<p class="tight">The editor needs no account, and the API answers on a free key.</p>
<div class="mk-actions" style="margin-top:var(--s4)"><a class="btn btn-primary btn-lg" href="/editor">Open the editor</a><a class="btn btn-lg" href="/docs">API docs</a></div>
</div></section>`;
  return doc(meta, `${nav("en", "")}${body}${footer("en")}`);
}

export function changelogPage(): string {
  const meta: Meta = {
    title: "Changelog — Code2Img",
    description: "What shipped, in order: the render pipeline, the public API, share pages, the MCP server, the design system and this site.",
    path: "/changelog",
    lang: "en",
    jsonLd: [breadcrumbs([{ name: "Home", path: "/" }, { name: "Changelog", path: "/changelog" }], "en")],
  };
  const body = `<section class="mk-hero"><div class="mk-wrap">
<h1 data-reveal>What shipped.</h1>
<p class="mk-lead" data-reveal style="max-width:58ch">Every entry below is a change that is live on ${BASE.replace("https://", "")} today.</p>
</div></section>
<section class="mk-sec" style="padding-top:0"><div class="mk-wrap prose" data-reveal-group><div data-reveal>${content("changelog")}</div></div></section>`;
  return doc(meta, `${nav("en", "")}${body}${footer("en")}`);
}

export function legalPage(kind: "terms" | "privacy" | "mentions", lang: Lang = "en"): string {
  const isMentions = kind === "mentions";
  const isFr = isMentions && lang === "fr";
  const pageLang: Lang = isFr ? "fr" : "en";
  const titles = {
    terms: { title: "Terms of service — Code2Img", h1: "Terms of service" },
    privacy: { title: "Privacy — Code2Img", h1: "Privacy policy" },
    mentions: isFr
      ? { title: "Mentions légales — Code2Img", h1: "Mentions légales" }
      : { title: "Legal notice — Code2Img", h1: "Legal notice" },
  }[kind];

  const description =
    kind === "terms"
      ? "The terms that apply to the Code2Img editor, the paid Pro plan, the public API, the MCP server and the share pages."
      : kind === "privacy"
        ? "What Code2Img stores, for how long, where it lives, and how to get it deleted. No advertising, no third-party analytics."
        : isFr
          ? "Éditeur, hébergement, données personnelles et médiation : les mentions légales de Code2Img."
          : "Publisher, hosting, personal data and mediation: the legal notice for Code2Img.";

  const lead = isFr
    ? "Éditeur : Code2Img (entreprise individuelle). Contact : hello@code2img.app. Dernière mise à jour : 15 novembre 2026."
    : "Last updated 15 November 2026. Operator: Code2Img. Contact: support@code2img.app.";

  const meta: Meta = {
    title: titles.title,
    description,
    path: isFr ? `/fr/legal/${kind}` : `/legal/${kind}`,
    lang: pageLang,
    alt: isMentions ? (isFr ? "/legal/mentions" : "/fr/legal/mentions") : undefined,
    jsonLd: [breadcrumbs([{ name: isFr ? "Accueil" : "Home", path: isFr ? "/fr" : "/" }, { name: titles.h1, path: `/legal/${kind}` }], pageLang)],
  };
  const contentFile = kind === "mentions" && !isFr ? `legal-${kind}-en` : `legal-${kind}`;
  const body = `<section class="mk-hero"><div class="mk-wrap">
<h1 data-reveal>${titles.h1}</h1>
<p class="mk-lead" data-reveal style="max-width:60ch">${lead}</p>
</div></section>
<section class="mk-sec" style="padding-top:0"><div class="mk-wrap prose" data-reveal-group><div data-reveal>${content(contentFile)}</div></div></section>`;
 return doc(meta, `${nav(pageLang, "")}${body}${footer(pageLang)}`);
}

/** Contact: form with dual choice (Support vs Partners), handled server-side. */
export function contactPage(lang: Lang): string {
  const prefix = lang === "fr" ? "/fr" : "";
  const t =
    lang === "fr"
      ? {
          title: "Contact — Code2Img",
          h1: "Contact.",
          lead: "Une question, un bug, un partenariat ? Remplissez le formulaire ci-dessous — réponse en principe sous 48 h ouvrées.",
          support: "Support technique",
          hello: "Partenaires & commercial",
          nameLabel: "Nom",
          emailLabel: "Email",
          subjectLabel: "Sujet",
          messageLabel: "Message",
          send: "Envoyer",
          sending: "Envoi en cours…",
          sent: "Message envoyé — nous vous répondrons sous 48 h ouvrées.",
          error: "Une erreur s'est produite. Réessayez plus tard.",
          required: "Ce champ est requis.",
          tooLong: "Trop long.",
          invalidEmail: "Adresse email invalide.",
          band: "Une question sur le produit avant d'écrire ?",
        }
      : {
          title: "Contact — Code2Img",
          h1: "Contact.",
          lead: "A question, a bug, a partnership? Fill in the form below — an answer in principle within 48 business hours.",
          support: "Technical support",
          hello: "Partnerships & business",
          nameLabel: "Name",
          emailLabel: "Email",
          subjectLabel: "Subject",
          messageLabel: "Message",
          send: "Send",
          sending: "Sending…",
          sent: "Message sent — we'll reply within 48 business hours.",
          error: "Something went wrong. Please try again later.",
          required: "This field is required.",
          tooLong: "Too long.",
          invalidEmail: "Invalid email address.",
          band: "A question about the product before writing?",
        };
  const meta: Meta = {
    title: t.title,
    description: t.lead,
    path: `${prefix}/contact`,
    lang,
    alt: lang === "fr" ? "/contact" : "/fr/contact",
  };
  const body = `<section class="mk-hero"><div class="mk-wrap">
<h1 data-reveal>${t.h1}</h1>
<p class="mk-lead" data-reveal style="max-width:60ch">${t.lead}</p>
</div></section>
<section class="mk-sec" style="padding-top:0"><div class="mk-wrap prose"><div data-reveal>
<form id="cf" class="contact-form" action="/api/contact" method="post" novalidate>
  <div class="contact-field">
    <label for="cf-name">${t.nameLabel}</label>
    <input type="text" id="cf-name" name="name" maxlength="100" required>
    <span class="err" data-err="name"></span>
  </div>
  <div class="contact-field">
    <label for="cf-email">${t.emailLabel}</label>
    <input type="email" id="cf-email" name="email" maxlength="254" required>
    <span class="err" data-err="email"></span>
  </div>
  <div class="contact-field">
    <label>${t.subjectLabel}</label>
    <div class="contact-choices">
      <label class="contact-choice"><input type="radio" name="topic" value="support" checked><span>${t.support}</span></label>
      <label class="contact-choice"><input type="radio" name="topic" value="hello"><span>${t.hello}</span></label>
    </div>
  </div>
  <div class="contact-field">
    <label for="cf-message">${t.messageLabel}</label>
    <textarea id="cf-message" name="message" rows="6" maxlength="5000" required></textarea>
    <span class="err" data-err="message"></span>
  </div>
  <div class="contact-field" style="display:none" aria-hidden="true">
    <input type="text" name="website" tabindex="-1" autocomplete="off">
  </div>
  <div class="contact-actions">
    <button type="submit" class="btn btn-primary btn-lg">${t.send}</button>
    <p class="contact-status" role="status" aria-live="polite"></p>
  </div>
</form>
</div></div></section>
<section class="mk-sec" style="padding-top:0"><div class="mk-wrap prose"><p data-reveal>${lang === "fr" ? "La documentation couvre l'essentiel : <a href=\"/docs\">référence API</a>, <a href=\"/pricing\">tarifs</a>." : "Docs cover most questions: <a href=\"/docs\">API reference</a>, <a href=\"/pricing\">pricing</a>."}</p></div></section>
<script>${contactJs(lang, t)}</script>`;
  return doc(meta, `${nav(lang, "")}${body}${footer(lang)}`);
}

function contactJs(lang: Lang, t: Record<string, string>): string {
  return `(() => {
  var form = document.getElementById("cf");
  if (!form) return;
  var status = form.querySelector(".contact-status");
  function showErr(name, msg) {
    var el = form.querySelector('[data-err="' + name + '"]');
    if (el) { el.textContent = msg || ""; el.hidden = !msg; }
  }
  function clearErrs() {
    form.querySelectorAll(".err").forEach(function (e) { e.hidden = true; e.textContent = ""; });
  }
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    clearErrs();
    var data = new FormData(form);
    var name = String(data.get("name") || "").trim();
    var email = String(data.get("email") || "").trim();
    var message = String(data.get("message") || "").trim();
    var topic = String(data.get("topic") || "support");
    var ok = true;
    if (!name) { showErr("name", ${JSON.stringify(t.required)}); ok = false; }
    else if (name.length > 100) { showErr("name", ${JSON.stringify(t.tooLong)}); ok = false; }
    if (!email) { showErr("email", ${JSON.stringify(t.required)}); ok = false; }
    else if (email.indexOf("@") < 1 || email.lastIndexOf(".") <= email.indexOf("@")) { showErr("email", ${JSON.stringify(t.invalidEmail)}); ok = false; }
    if (!message) { showErr("message", ${JSON.stringify(t.required)}); ok = false; }
    else if (message.length > 5000) { showErr("message", ${JSON.stringify(t.tooLong)}); ok = false; }
    if (!ok) return;
    var btn = form.querySelector('button[type="submit"]');
    var prev = btn.textContent;
    btn.disabled = true;
    btn.textContent = ${JSON.stringify(t.sending)};
    status.textContent = "";
    fetch("/api/contact", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: name, email: email, message: message, topic: topic, website: data.get("website") || "" })
    }).then(function (res) {
      return res.json().then(function (j) { return { ok: res.ok, j: j }; });
    }).then(function (r) {
      if (r.ok) {
        status.textContent = ${JSON.stringify(t.sent)};
        form.reset();
      } else {
        status.textContent = r.j && r.j.error ? r.j.error : ${JSON.stringify(t.error)};
      }
    }).catch(function () {
      status.textContent = ${JSON.stringify(t.error)};
    }).then(function () {
      btn.disabled = false;
      btn.textContent = prev;
    });
  });
})();`;
}

export const API = { apiSnippet, mcpSnippet };
