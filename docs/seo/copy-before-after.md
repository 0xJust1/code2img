# Copy rewrite — before / after (2026-11-15)

Scope: text only. No layout, no CSS, no component structure. Files touched:
`apps/web/app/site/pages.ts`, `apps/web/app/site/faq.ts`, `apps/web/app/site/shell.ts` (JSON-LD
strings), `apps/web/app/mcp/page-html.ts`, `apps/web/content/api.html`, `apps/web/app/layout.tsx`
(default metadata), `apps/web/app/manifest.ts`, `apps/web/app/i/[slug]/page.tsx` (share metadata),
`apps/web/app/llms.txt/route.ts`, plus one derived constant in `packages/shared/src/detect.ts`.

Untouched on purpose: `apps/web/scripts/gen-assets.mjs`, which prints the line *"Paste a snippet,
pick a theme, export a pixel-perfect PNG."* onto the generated example images. That string is baked
into PNGs, so changing it means regenerating the assets, which is an image job and not a copy job.

Voice: the existing site copy is the writing sample, so it stays — short declarative sentences,
em dashes where the writer used them, no exclamation marks, no "we're excited". What changed is that
every page now states its target query in the title, the meta description and the H1, and every
number in the copy is sourced from the repo.

## What the copy had to fix, in order of weight

1. **The landing never said "code to image".** The query measures 2,400/mo (US) with KD 32 and LOW
   ad competition. The page said *"turn code into an image"* in the title, *"Code in, image out."* as
   the H1, and *"Paste a snippet, pick a theme, export a pixel-perfect PNG in seconds"* in the lead.
   Three near-misses and one unverifiable claim.
2. **"pixel-perfect" and "in seconds"** — sales language with nothing behind it. The product
   renders at a chosen scale with the layout you set; that is the real, checkable promise, and it is
   already in the features list.
3. **"19 languages are recognised automatically"** — `COUNTS.languages` was `LANGUAGES.length`, and
   `LANGUAGES` is the API enum: it includes `auto` and `text`. The detector returns 17 distinct
   languages. The number on the page was wrong by two and nobody could see it from the copy.
4. **`/api` was titled `API — Code2Img`** and its description opened with a colon-list. Nobody
   searching for a code-image API can tell what the page is.
5. **`/mcp` said "Render cards"** — the product's own word for a render, invisible to anyone who has
   not already read the landing page.
6. **The FAQ had no direct answer** to the query the site ranks for, while every target SERP shows an
   AI Overview. That is the highest-value paragraph on the site and it was missing.

## Landing `/` (EN)

| Slot | Before | After |
|---|---|---|
| title | Code2Img — turn code into an image | Code to image — paste a snippet, export a PNG \| Code2Img |
| description | Paste a snippet, pick a theme, export a pixel-perfect PNG, JPG or PDF. Share a public link, or render it from the API and from your AI agent. | Code to image in the browser: paste a snippet, pick a theme, export PNG, JPG or PDF at up to 4×, or render it from the REST API or an MCP server. |
| h1 | Code in, image out. | Code to image. |
| lead | Paste a snippet, pick a theme, export a pixel-perfect PNG in seconds. Share a link, or render it from the API and from your AI agent. | Paste a snippet, choose a theme, export PNG, JPG or PDF. There is no account to create: the same render is one POST away for a script and one tool call away for an agent. |
| feature 3 h3 | One render pipeline, three doors | One pipeline, three ways in |
| pricing h2 | Free to use. 7 € a month to make it yours. | Free to use. Pro is 7 € a month. |
| dev paragraph | 19 languages are recognised automatically. | 17 languages are recognised automatically. |

Why the H1 lost its rhythm: `Code in, image out.` is the better headline and the worse H1. The
query moved into the H1, and the cadence survives in the lead and the section titles. If the phrase
ever gets its own page or the query dies, put the original line back.

Title is 58 characters, description 151. Both render from `HOME.en`; verified in the served HTML.

## Landing `/fr`

| Slot | Before | After |
|---|---|---|
| title | Code2Img — transformez du code en image | Code en image : transformez un extrait en PNG \| Code2Img |
| description | Collez un extrait, choisissez un thème, exportez un PNG, JPG ou PDF net. Partagez un lien public, ou générez-le depuis l'API et depuis votre agent IA. | Transformez du code en image dans le navigateur : collez un extrait, choisissez un thème, exportez en PNG, JPG ou PDF, ou passez par l'API REST et le serveur MCP. |
| h1 | Du code, une image. | Du code à l'image. |
| lead | Collez un extrait, choisissez un thème, exportez un PNG net en quelques secondes. Partagez un lien, ou passez par l'API et par votre agent IA. | Collez un extrait, choisissez un thème, exportez en PNG, JPG ou PDF. Aucun compte à créer : le même rendu s'obtient par un POST depuis un script, ou par un appel d'outil depuis un agent. |
| pricing h2 | Gratuit, ou 7 € par mois. | Gratuit. Pro à 7 € par mois. |

`code en image` measures 20/mo in France. The page is not an acquisition channel; it is the French
door to a product that speaks English by default. It got the same query alignment because it costs
nothing, and it did **not** get a machine translation of the English lead — the sentences are French
sentences that happen to carry the same facts.

## `/pricing`

| Slot | Before | After |
|---|---|---|
| title | Pricing — Code2Img | Pricing — free to use, Pro removes the watermark \| Code2Img |
| description | Code2Img is free to use. Pro removes the watermark, raises exports to 4×, unlocks your own logo and backgrounds and lifts the API quota. | The Code2Img editor is free. Pro removes the watermark, raises exports to 4×, adds your logo and your own background, and lifts the API quota. |
| (fr) title | Tarifs — Code2Img | Tarifs — gratuit, Pro retire le filigrane \| Code2Img |
| (fr) description | Code2Img est gratuit. Pro supprime le filigrane, monte les exports à 4×, débloque votre logo et vos fonds et relève le quota d'API. | L'éditeur Code2Img est gratuit. Pro retire le filigrane, monte les exports à 4×, ajoute votre logo et votre propre fond, et relève le quota d'API. |

No query with volume maps to this page, and the copy does not pretend otherwise. "unlocks" became
"adds": two different products on the same plan, two verbs that say what happens. The H1, the lead,
the comparison table and the FAQ were already accurate and stayed.

## `/api`

| Slot | Before | After |
|---|---|---|
| title | API — Code2Img | API — render a code image over HTTP \| Code2Img |
| description | Code2Img's REST API: render an image from a JSON config, list themes, read usage, signed URLs. Keys, scopes, quotas, the OpenAPI spec and the TypeScript SDK. | Code2Img's REST API turns a JSON config into a code image: PNG, JPG or PDF at up to 4×. Keys, scopes, quotas, signed URLs, the OpenAPI spec and the TypeScript SDK. |
| lede | …you can ask for over HTTP — the same themes, the same limits, the same bytes. | …you can ask for over HTTP: a code image from a JSON config, with the same themes, the same limits and the same bytes. |

The page does **not** target `code screenshot api`. That SERP is website screenshot services
(URL-to-image); a visitor who lands there from it wants the wrong product. `/api` targets
`code image api` and its own brand, and the body (endpoints, RFC 9457 errors, quotas, idempotency)
was already the honest, specific writing a developer needs. Only the head changed.

## `/mcp`

| Slot | Before | After |
|---|---|---|
| title | MCP server — Code2Img | MCP server — render code images from an agent \| Code2Img |
| description | Connect Code2Img to Claude, Cursor, VS Code or Windsurf: seven MCP tools to render code screenshots, list themes and create share links. | Connect Code2Img to Claude, Cursor, VS Code or Windsurf: seven MCP tools to render a code image, browse themes and backgrounds, and create expiring share links. |
| h1 | Render cards from your agent. | Render code images from your agent. |
| lead | …Seven MCP tools let an AI client render a code screenshot, browse themes and backgrounds… | …Seven MCP tools let an AI client render a code image, browse themes and backgrounds… |

"code screenshot" was dropped here too: the SERP for MCP screenshot servers is browser screenshot
tools, and the phrase pulls the page into the wrong cluster. "code image" keeps it in the render
cluster the landing page owns. The rest of the page (six client snippets, the tool table, the "not on
npm yet" caveat) was accurate and untouched.

## FAQ (both languages, feeds `FAQPage` JSON-LD on `/`, `/fr`, `/pricing`)

Added one pair, first position, because every target SERP carries an AI Overview:

> **How do I turn code into an image?** — Paste the snippet into the editor, choose a theme and a
> font, then export. You get a PNG, JPG or PDF that keeps the padding, radius, background and window
> chrome you set. The same three steps run over HTTP: POST the config to `/api/v1/images` and read the
> bytes back.

> **Comment transformer du code en image ?** — Collez l'extrait dans l'éditeur, choisissez un thème et
> une police, puis exportez. Vous obtenez un PNG, JPG ou PDF qui conserve le padding, le rayon, le fond
> et la barre de fenêtre réglés. Les trois mêmes étapes existent en HTTP : envoyez la configuration à
> `/api/v1/images` et récupérez les octets.

It answers in the first sentence, then gives the three steps, then the HTTP path. Nothing in it is a
claim about quality.

## The surfaces around the pages

The same unverifiable phrasing sat in metadata that no page shows to a human but every crawler reads.

| Surface | Before | After |
|---|---|---|
| `app/layout.tsx` default title | `Code2Img — turn code into an image` | `Code2Img — code to image, with an API and an MCP server` |
| `app/layout.tsx` default description | `Paste code, pick a theme, export a pixel-perfect PNG/JPG/PDF. Built with Code2Img.` | `Turn a code snippet into a PNG, JPG or PDF: pick a theme, export, or render it from the REST API and the MCP server.` |
| `app/manifest.ts` (PWA) | `Turn code into pixel-perfect images, shareable links, an API and an MCP server.` | `Turn a code snippet into a PNG, JPG or PDF, share a link, or render it from the API or an MCP server.` |
| `/i/<slug>` share description | `Code2Img — paste code, pick a theme, export a pixel-perfect image.` | `Code2Img — paste code, pick a theme, export a PNG, JPG or PDF.` |
| home JSON-LD description | `Turn code snippets into pixel-perfect images, shareable links…` | `Turn a code snippet into an image (PNG, JPG or PDF), a shareable link, a REST API call or an MCP tool call for an AI agent.` |
| home JSON-LD featureList | `PNG, JPG and PDF export up to 4x` (4× is Pro only) | `PNG, JPG and PDF export at 2x on Free and 4x on Pro` |
| `llms.txt` opening | `renders source code into shareable images (PNG/JPG)` | `renders source code into images (PNG, JPG, PDF)` |
| `llms.txt` catalog line | `Languages (19): auto, auto, typescript, …` (the id appeared twice) | `Languages (19 ids, "auto" detects one): auto, typescript, …` |

`gen-assets.mjs` still prints "pixel-perfect" onto the generated example images. Those are PNGs, not
HTML; restyling them is an asset regeneration, out of scope for a copy pass.

## Claim audit — every assertion checked against the code

| Claim on the page | Source in the repo | Verdict |
|---|---|---|
| 18 themes, 7 fonts | `packages/shared/src/themes.ts` (THEMES 18, FONTS 7) | true |
| 17 languages recognised automatically | `detect.ts` RULES → 17 distinct ids | true after the fix (was 19) |
| 2× Free / 4× Pro | `entitlements.ts` FREE_MAX_SCALE 2, PRO_MAX_SCALE 4 | true |
| 10 presets Free / unlimited Pro | `entitlements.ts` maxPresets | true |
| 30/min + 500/day Free, 300/min + 5,000/day Pro | `entitlements.ts` API_LIMITS | true |
| watermark `code2img.app`, removed on Pro | `apps/render/src/pipeline.ts` (Free forces watermark), `can(plan,"no-watermark")` | true |
| own logo and own background are Pro | `can(plan,"custom-logo" / "custom-background")` | true |
| PNG, JPG and PDF | `apps/render/src/render.ts` Format + `page.pdf()` | true |
| 1:1, 16:9, 4:5, OG crop | `config.ts` ratioSchema + pixel pairs | true |
| share page `/i/<slug>` with OG preview and expiry | `app/i/[slug]/page.tsx`, `api/share` returns `expiresAt` | true |
| signed URLs | `app/api/v1/signed-url`, `app/api/v1/render.png` | true |
| RFC 9457 problem documents | `src/lib/api/problem.ts`, `application/problem+json` | true |
| idempotency keys | `src/lib/api/idempotency.ts` | true |
| TypeScript SDK | `packages/sdk` | true |
| seven MCP tools | `app/mcp/page-html.ts` TOOLS (7 entries) | true |
| uploads accept PNG, JPG, WebP | `src/lib/uploads.ts` ALLOWED_MIME | true |
| editor works without an account | editor route + share flow | true |

Nothing on the pages promises a feature that `entitlements.ts` does not grant. The one figure that
was wrong was the language count, and it was wrong in the safe direction: the product claimed more
than it does.

## Verification

- `npx tsc --noEmit` in `apps/web`: exit 0.
- `npx vitest run` in `apps/web`: 34 tests, 3 files, all pass. In `packages/shared`: 16 tests, all
  pass (the `DETECTED_LANGUAGES` export does not disturb `detect`).
- `next dev` on :3111, all six pages returned 200 and the served HTML carries the new titles,
  descriptions and H1 (`/` 58-char title, `/fr`, `/pricing`, `/fr/pricing`, `/api`, `/mcp` with
  `Accept: text/html`).
- Landing renders `17 languages are recognised automatically.` and the new FAQ pair appears twice
  (visible block + JSON-LD).
