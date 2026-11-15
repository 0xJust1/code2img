# Code2Img — 10 Blog Article Ideas

Constraint on this list: every idea below depends on something Code2Img actually does and can show —
the Playwright/Chromium render pipeline, the 18 bundled Shiki themes, the 7 bundled fonts, the heuristic
detector in `packages/shared/src/detect.ts`, the `og` 1200×630 ratio, the remote MCP server, the
`/api/v1` limits, or the share pages at `/i/<slug>`. Nothing here is "why code screenshots matter".

Facts available to every article: 50 KB code cap; font size 10–24 (default 16); padding 0–128
(default 48); width 240–2000; ratios 1:1 1200×1200, 16:9 1280×720, 4:5 1080×1350, og 1200×630;
scale 1–4 (4x is Pro); PNG/JPG/PDF; ligatures toggle; 50 highlight-line markers max.

---

## 1. How we render a code image: Chromium, `deviceScaleFactor`, and `document.fonts.ready`

- **Target keyword:** how code screenshot tools render (EN) · *re-check in 3 months*
- **Intent:** informational — developer audience, engineering-credibility piece
- **Outline:**
  - Why a canvas-drawn highlighter and a real browser disagree (subpixel positioning, kerning, fallbacks)
  - The pipeline: `buildCardHtml` → `setContent` → `document.fonts.ready` → `locator('#capture').screenshot()`
  - `deviceScaleFactor: req.scale` — one DOM, four output resolutions, no re-layout
  - Why we wait on `document.fonts.ready` and what a screenshot looks like when you don't
  - The sandbox: every non-self-origin request is aborted, so a remote font or remote image silently cannot leak in
  - PDF is a different path: `page.pdf({ printBackground: true, pageRanges: "1" })`
  - Transparent background only makes sense in PNG: `omitBackground`
  - What this costs: a 15 s render timeout and one warm browser instance
- **Length:** 1800–2200 words
- **Links to:** `/docs` (API surface), `/pricing` (4x), `/code-screenshot/typescript` (worked example)

## 2. Why your TypeScript keeps getting detected as JavaScript

- **Target keyword:** shiki language detection typescript (EN) · *evergreen*
- **Intent:** informational — high-intent, low-competition, and it is a real defect class
- **Outline:**
  - The detector is ordered, most-specific-first — order is the whole story
  - Rule 13 fires on `const`, `let`, `=>{`, `console.`, or a line starting with a brace → `javascript`
  - Rule 14 (`interface`, `type X =`, `: string|number|boolean`, `import type`) sits *after* it
  - Consequence: `const el: HTMLElement = …` loses type colouring; `interface User {` alone survives
  - Why this is not a bug we can just "fix" — loosening the order breaks Ruby, PHP and Go
  - The cheap workaround: pass `language: "typescript"` explicitly, or start the snippet with a type declaration
  - Measured examples: four real snippets, showing what the automatic choice does to each
- **Length:** 1100–1400 words
- **Links to:** `/code-screenshot/typescript`, `/docs` (`language` parameter)

## 3. The `function` keyword trap: why your JS snippet renders as PHP

- **Target keyword:** code screenshot wrong language detection (EN) · *evergreen*
- **Intent:** informational — troubleshooting intent, extremely specific to this product
- **Outline:**
  - One regex, `\bfunction\s+\w+\s*\(`, decides between PHP and JavaScript — and it runs first
  - What that does to a vanilla `function debounce(fn, ms) { … }` paste
  - The same class of trap in reverse: C++ `using namespace std;` matches the C# rule
  - Ruby vs Python: `def` needs a paren-and-colon to win for Python; bare `def foo` falls to Ruby
  - Bash is the worst case: its rule is *last*, so `if [ -f x ]; then` with no `$` lands on the TypeScript default
  - A short decision table: snippet shape → what auto picks → what to set manually
  - Rule of thumb: auto is for the editor's convenience, `language` is for anything you will publish
- **Length:** 1200–1500 words
- **Links to:** `/docs`, `/code-screenshot/php`, `/code-screenshot/shell`

## 4. Eighteen themes, ranked by what they do to one snippet

- **Target keyword:** best theme for code screenshots (EN) · *re-check in 3 months*
- **Intent:** informational/commercial — visual comparison, strong share potential
- **Outline:**
  - The exact list we ship: github-dark, github-light, vitesse-dark, vitesse-light, one-dark-pro,
    dracula, tokyo-night, night-owl, material-theme-darker, min-dark, min-light, catppuccin-mocha,
    catppuccin-latte, rose-pine, rose-pine-moon, nord, ayu-dark, synthwave-84
  - Method: same snippet, same font, same padding, only `theme` changes — one image per theme, one grid
  - Which ones survive JPEG at 60% quality (the thin-comment themes lose first)
  - Contrast on the keyword axis: `min-light` vs `github-light` vs `catppuccin-latte` for a light deck
  - `synthwave-84` and `dracula` as the two that draw attention to the card instead of the code
  - `one-dark-pro` and `github-dark` as the safe defaults for a README
  - A "pick by context" table: slide, docs, README, social post
  - Honest note: this is a taste argument, with the images as the evidence
- **Length:** 1600–2000 words (image-heavy)
- **Links to:** `/` (live theme switcher), `/code-screenshot/python`

## 5. Ligatures: the three fonts of ours that have them, and when to switch them off

- **Target keyword:** jetbrains mono vs fira code ligatures (EN) · *evergreen*
- **Intent:** informational — a genuine typography question, answerable with the bundled fonts only
- **Outline:**
  - Which of the 7 fonts carry ligatures: JetBrains Mono, Fira Code, Cascadia Code — and which do not
    (IBM Plex Mono, Source Code Pro, Roboto Mono, Space Mono)
  - What `=>`, `!==`, `!=`, `<=`, `::` actually turn into in each of the three
  - The failure mode: `!=` ligature reading as `≠` in a screenshot someone will copy from
  - Why `ligatures` is a toggle and defaults to on, and the two cases to turn it off (teaching material, SQL)
  - `Space Mono` as the "I want it to look designed, not like my editor" pick
  - Width consequences: ligatures change advance width, so the same snippet wraps differently — with padding 48,
    the difference shows at font size 16 on a 16:9 1280×720 card
  - A/B strip: same snippet, ligatures on/off, three fonts
- **Length:** 1200–1500 words
- **Links to:** `/docs` (config field), `/code-screenshot/go`

## 6. Font size 10 to 24: a sizing table for code that has to be readable at phone width

- **Target keyword:** code screenshot font size (EN) · *evergreen*
- **Intent:** informational — a decision the reader cannot make without numbers
- **Outline:**
  - The real clamp: 10–24, default 16, and the width clamp 240–2000 px
  - The arithmetic that matters: characters per line = usable width ÷ (font size × ~0.6 for a monospace)
  - Worked numbers at 16: how many columns fit at width 800, 1200, 1600, with padding 48
  - Ratio × font size matrix: `4:5` 1080×1350 wants a different size than `16:9` 1280×720
  - Where 80-column discipline comes from, and why 100+ columns is the enemy of a screenshot
  - Short lines, wide card: why padding 48 is a default and when 24 or 96 is better
  - Three reference cards at 10, 16, 24 with the same snippet, and which one is legible on a 390 px phone
  - When to raise `scale` (1–4) instead of font size — and why 4x is Pro
- **Length:** 1300–1600 words
- **Links to:** `/pricing`, `/code-screenshot/ruby`

## 7. OG images made of code: using the 1200×630 ratio without a design tool

- **Target keyword:** og image for code blog post (EN) · *re-check in 3 months*
- **Intent:** informational→transactional — blog authors and devrel
- **Outline:**
  - Why `og` is a preset and not a suggestion: 1200×630 is what the scrapers crop to
  - The math: at 630 px tall with padding 48, you get ~534 px of code — roughly 20 lines at size 16
  - Pick 18 of your 400 lines; the `title` field (max 120 chars) carries the explanation
  - Highlight lines (max 50 markers) as the OG image's only way of pointing at something
  - Per-platform crop: X, LinkedIn, Slack unfurl — same card, three visible regions
  - The share link: `/i/<slug>` with expiry, so the OG image and the human page stay one object
  - A copy-paste recipe: API call with `ratio: "og"`, `scale: 2`, `watermark: false` (Pro)
  - Checklist before publishing
- **Length:** 1400–1700 words
- **Links to:** `/docs`, `/pricing`, `/blog`

## 8. Rendering code from an AI agent: what the MCP server actually returns

- **Target keyword:** mcp server render code image (EN) · *re-check in 3 months*
- **Intent:** informational — the audience named in the brief, and the least-served query
- **Outline:**
  - What a remote MCP endpoint is, in two paragraphs and no hype
  - The tool surface: same `config` as `/api/v1` — code, language, theme, font, size, ratio, scale
  - The agent-specific problem: agents generate 200-line diffs and want a 20-line image — the `50 KB` cap
    and `MAX_CODE_BYTES` are not the constraint, taste is
  - Auto-detection from an agent is *worse* than from a human: generated code frequently mixes languages,
    so `language: "auto"` on an agent payload is a coin flip (see the `function` trap)
  - Rate limits as a design input: 30 req/min free vs 300 Pro — agents retry
  - Two worked transcripts: one clean, one where the agent must be told to set `language` explicitly
  - What the agent should do with the share link versus the bytes
- **Length:** 1500–1800 words
- **Links to:** `/mcp`, `/docs`, `/pricing`

## 9. Comparing the grammar of code screenshots, not the tools

- **Target keyword:** code screenshot anatomy comparison (EN) · *re-check in 3 months*
- **Intent:** commercial-adjacent — the piece that should sit behind `/vs/*` and link to it
- **Outline:**
  - Frame the comparison on mechanics anyone can verify on a live page: window chrome, padding rhythm,
    line numbers, background (gradient vs solid vs transparent), export scale, API
  - The four window styles we offer (mac, windows, minimal, none) and what each signals
  - Why the same snippet looks "cheap" or "designed" purely from padding-to-font-size ratio
  - Line numbers as a readability decision, not a default — and when they lie (partial snippets)
  - Backgrounds: gradient vs transparent PNG for docs; the `background.type` values that exist
  - Export: scale 1–4, PNG vs JPG at quality 1–100, PDF — where each tool's own page must be checked
    the same day, and how to check it in 90 seconds
  - A blank comparison grid to fill in per candidate, with the fields named
  - Explicit line: this article states no competitor capability we have not verified today
- **Length:** 1800–2200 words
- **Links to:** `/vs/ray-so`, `/vs/carbon`, `/vs/snappify`

## 10. Fifty kilobytes of code: what happens when you paste a whole file

- **Target keyword:** code screenshot too long / long code image (EN) · *evergreen*
- **Intent:** informational — troubleshooting, and the honest-limits piece
- **Outline:**
  - The hard cap: 50 KB per snippet, enforced by the schema, with the error message it returns
  - What 50 KB is in practice: ~1000–1300 lines of average code — more than any card can show
  - Why a taller card is the wrong fix: readable text has a size floor, and ratio presets cap height
  - The three honest options: crop to the relevant 25 lines, split into a numbered sequence of cards,
    or export PDF and paginate
  - Highlighting lines to keep continuity across a split sequence
  - Width 240–2000: why narrowing a 200-column file is worse than cropping it
  - A worked example: a 900-line file → three cards, with the `title` field doing the storytelling
  - What we deliberately do not do (auto-summarise the code, shrink text below 10) and why
- **Length:** 1200–1500 words
- **Links to:** `/docs`, `/pricing`, `/code-screenshot/java`

---

## Publishing order and interlinking

1. #2 and #3 first — they are troubleshooting pieces, they answer questions real users hit on day one,
   and they prove the product's mechanics better than any landing page.
2. #6 and #7 next — both are directly transactional and feed `/pricing` and `/docs`.
3. #1 and #10 — credibility and honesty.
4. #4 and #5 — visual, shareable, they need the image pipeline stable.
5. #8 — the agent audience is the newest; publish once `/mcp` has a real page.
6. #9 last, once `/vs/*` exists, and only after re-checking the competitors live.

Every article links to at least one `/code-screenshot/<language>` page and one of `/docs` or `/pricing`,
which is the whole point of the blog existing.