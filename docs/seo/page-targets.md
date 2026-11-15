# Code2Img — one page, one query (measured 2026-11-15)

Every number below comes from DataForSEO on 2026-11-15: Google Ads search volume, Labs
`bulk_keyword_difficulty`, and live Google SERPs. Location 2840 (United States) for EN, 2250
(France) for FR. A `0` is a measurement, not a guess: Google Ads reports no volume for the phrase
in that market. `KD n/a` means Labs holds no difficulty score for it, which happens on nearly every
long-tail phrase in this niche.

Of the 33 EN keywords in `keyword-plan.md`, 25 measure zero. Of the 26 FR keywords, 25 measure
zero. The plan was written from product capability, not from demand; this document replaces that
assumption with what the tools actually return, and the copy is aligned on it. Two queries carry the site: `code to image` at 2,400/mo and `code image generator` at 170/mo,
both in the same transaction and both on the landing page.

## The mapping

| Page | Target query | Volume/mo | KD | Intent | Status |
|---|---|---|---|---|---|
| `/` | code to image | 2,400 | 32 | transactional | shipped, aligned |
| `/` (secondary) | code image generator | 170 | n/a | transactional | same page, same intent, no second landing |
| `/` (tertiary) | code screenshot generator | 40 | 0 | transactional | absorbed by `/` |
| `/fr` | code en image | 20 | n/a | transactional | shipped, low ceiling by design |
| `/pricing` | no query with volume | 0 | n/a | decision, not discovery | conversion page, reached from `/` |
| `/api` | code image api | 0 | n/a | commercial, developer | shipped, brand + docs traffic |
| `/mcp` | mcp server + render a code image | 0 | n/a | informational, agent builder | shipped, SERP is contested |
| `/code-screenshot/<lang>` × 10 | `<language> code screenshot` | 0–20 | 0–n/a | transactional, long tail | shipped, no volume signal yet |
| `/vs/ray-so`, `/vs/carbon`, `/vs/snappify` | `<tool> alternative` | 10 each | n/a | commercial | shipped, converts more than it discovers |

## What each SERP actually looks like

**`code to image` (2,400/mo, KD 32, competition LOW, AI Overview present).** Organic results are
tool pages and GitHub repos, not a dominant brand: "Save Code to Image — Tools Collection",
`xuho/code2image`, "Code to Image Converter", a Spanish-language converter at rank 4. KD 32 with
LOW ad competition means the barrier is content quality, not authority. This is the only page worth
optimising for discovery, and it is the only page whose title now carries the phrase verbatim.

**`code image generator` (170/mo, CPC $8.01, competition LOW).** Same intent, different wording.
Note the CPC: advertisers pay $8.01 a click for it, which is why it is folded into `/` and not given
its own URL. A second landing page would split the two and lose both.

**`code screenshot api` (0/mo).** Measured and rejected. The SERP is entirely *website* screenshot
APIs (URL-to-image services), with related searches `code screenshot api python`, `... github`,
`... javascript`. Somebody searching that phrase wants to screenshot a web page, not to render a
snippet. Targeting it on `/api` would attract the wrong visitor and dilute the page. `/api` targets
`code image api` and the brand instead.

**`mcp server code screenshot` / `mcp server render code` (0/mo, AI Overview + video).** The SERP
is owned by browser-screenshot MCP servers (`mcp-screenshot-website-fast`, `screenshot-mcp`,
Screeny). Code2Img cannot win the generic phrase and should not try; the page targets the narrower
"render a code image from an agent" and states the difference in the first sentence, because an AI
Overview answering "MCP screenshot server" will otherwise classify it with the browser tools.

**`screenshot code` (0/mo, but a trap).** The SERP is "screenshot → code" (AI turns a picture into
code). Exact opposite intent. Never target it, in any language.

**`code en image` (20/mo, FR, AI Overview + images + PAA).** The PAA is "Comment mettre une image
dans un code HTML ?" — the French query mixes "code to image" with "image in HTML". The page exists
for the French visitor arriving from the EN site or from a direct link; it is not an acquisition
channel, and no FR content investment is justified by these numbers.

## Copy rules that follow

- The H1 of `/` is `Code to image.` — the query, stated. The previous `Code in, image out.` is a
  better headline and a worse H1; the phrase moved to the title, the description and the H1, and the
  voice survives in the lead and the section headings.
- Titles carry the phrase once, then the differentiator, then the brand. No title repeats a keyword
  the H1 already owns.
- Each page answers its query in the first 100 words, in one sentence a machine can quote. Every
  target SERP shows an AI Overview, so a paragraph that answers before it qualifies is the only
  thing that gets cited.
- No page claims a number it cannot source from the repo. The language count on the landing read
  `19` (the length of the `LANGUAGES` array, which includes the `auto` and `text` values); the
  detector returns 17 distinct languages. The copy now reads `DETECTED_LANGUAGES.length`.
- French pages are written in French, not translated from the English sentences. Same facts,
  different sentences.

## Cost of the measurement

$0.24 total, read off the account balance: $1.0646 before, $0.8250 after. Two bulk KD calls, two
search-volume calls, two keyword-ideas calls (both returns were off-topic and were not used), five
live SERPs. `ideas` is not a usable tool for this niche: both seeds returned the generic "image
conversion" cluster (text to speech, QR codes), which is why the analysis rests on exact-phrase
volume and SERP composition instead.
