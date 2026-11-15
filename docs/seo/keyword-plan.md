# Code2Img — Keyword Plan (EN + FR)

Verified against the repo on 2026-11-15: `packages/shared/src/themes.ts` (18 themes, 7 fonts),
`packages/shared/src/detect.ts` (auto-detection rules and their order), `packages/shared/src/config.ts`
(limits: 50 KB code, font size 10–24 default 16, padding 0–128 default 48, width 240–2000,
ratios 1:1 1200×1200 / 16:9 1280×720 / 4:5 1080×1350 / og 1200×630, scale 1–4).

> **Measured on 2026-11-15 (DataForSEO).** The tables below were written from product capability
> and carry no volume. They have now been measured: **25 of the 33 EN keywords and 25 of the 26 FR
> keywords return zero Google Ads volume** in their market. Two queries carry the site —
> `code to image` (2,400/mo US, KD 32) and `code image generator` (170/mo US) — and both belong to
> `/`. Treat every `0` row as a long-tail bet to confirm in Search Console, not as a demand
> forecast. Per-page targets and SERP evidence: `page-targets.md`. Copy alignment:
> `copy-before-after.md`.

## Measured demand (EN = US 2840, FR = France 2250, 2026-11-15)

| Keyword | Vol/mo | KD | Note |
|---|---|---|---|
| code to image | 2,400 | 32 | the one real query; AI Overview on the SERP, no dominant brand |
| code image generator | 170 | n/a | CPC $8.01 — high commercial value, same intent as above |
| code screenshot generator | 40 | 0 | folded into `/` |
| python code to image | 20 | 0 | only language phrase with a number |
| java code screenshot | 10 | n/a | |
| ray.so alternative | 10 | n/a | |
| carbon.now.sh alternative | 10 | n/a | |
| snappify alternative | 10 | n/a | |
| code en image (FR) | 20 | n/a | the only FR phrase with a number |
| all other EN rows (25) | 0 | n/a | zero volume, KD unavailable (`null` in Labs) |
| all other FR rows (25) | 0 | n/a | zero volume, KD unavailable |

Rejected after reading the SERP, not after reading a number:

- **`code screenshot api`** — the SERP is website URL-to-image APIs, not snippet rendering. Wrong
  intent for `/api`.
- **`mcp server code screenshot`** — owned by browser-screenshot MCP servers; Code2Img targets the
  narrower "render a code image from an agent" instead.
- **`screenshot code`** — the SERP is "screenshot *to* code" (AI image-to-code). Exact opposite
  intent; never target it.

## Page inventory — what exists vs what must be built

| Target page | Status today |
|---|---|
| `/` | exists |
| `/pricing` | exists |
| `/docs` | exists (also `/mcp`, `/llms.txt`) |
| `/vs/ray-so`, `/vs/carbon`, `/vs/snappify` | **to build** |
| `/code-screenshot/<language>` | **to build** (10 languages) |
| `/blog` | **to build** |

Language URL slugs must match the real Shiki ids used by the product, so the page slug and the tool's
`language` parameter agree: `typescript`, `python`, `go`, `rust`, `sql`, `shell` (the label is Bash),
`java`, `csharp`, `php`, `ruby`.

## How to read the tables

- **Intent** — informational (learning/research), commercial (comparing options before choosing),
  transactional (ready to produce an output now).
- **Why it can rank** — the page's actual asset, not a promise. Anything resting on a page that does
  not exist yet is marked *(blocked on page)* and should not be briefed until that page ships.
- **Durability** — 🟢 evergreen: the query means the same thing in three years.
  🟡 re-check in 3 months: the phrase is tied to a tool, a UI, a language version or an AI-agent fashion
  and can drift, decay or get re-defined.

---

## EN — cluster 1: code-to-image (core transactional)

| # | Keyword | Intent | Target page | Why it can rank | Dur. |
|---|---|---|---|---|---|
| 1 | code to image | transactional | `/` | Exact product action; the editor renders without an account, so the page can prove the promise above the fold | 🟢 |
| 2 | code screenshot generator | transactional | `/` | Same intent, different wording; covered by one page, no cannibalisation | 🟢 |
| 3 | code snippet to png | transactional | `/` | Names the output format the tool actually produces | 🟢 |
| 4 | convert code to png online | transactional | `/` | "online" + "png" is the query shape of someone who wants zero install | 🟢 |
| 5 | code to image 4x resolution | transactional | `/pricing` | Only Pro does 4x; pricing page is where the scale parameter is explained | 🟢 |
| 6 | code screenshot without watermark | transactional | `/pricing` | Free plan watermarks, Pro does not — the page states the trade honestly | 🟡 |
| 7 | code to pdf snippet | transactional | `/` | PDF is a real output, rarely offered by screenshot tools | 🟢 |
| 8 | code image api | commercial | `/docs` | `/api/v1` is documented with limits (30/min free, 300/min Pro) | 🟢 |
| 9 | generate code image from terminal | informational | `/docs` | cURL example exists; developer-to-developer page | 🟢 |

## EN — cluster 2: comparison (commercial)

| # | Keyword | Intent | Target page | Why it can rank | Dur. |
|---|---|---|---|---|---|
| 10 | ray.so alternative | commercial | `/vs/ray-so` | Searchers already know the tool; a page that compares *mechanics* (export scale, API, share links) answers the question | 🟡 |
| 11 | carbon.now.sh alternative | commercial | `/vs/carbon` | Same, and Carbon's own query volume sends people looking for what replaced it | 🟡 |
| 12 | snappify alternative | commercial | `/vs/snappify` | Snappify is the paid/marketing-heavy one; the query is price-driven | 🟡 |
| 13 | code screenshot tool comparison | commercial | `/vs/ray-so` | One comparison hub can absorb the generic phrase | 🟡 |
| 14 | carbon vs ray.so | commercial | `/vs/carbon` | Third-party framing; needs the page to state only what is checked live | 🟡 |

## EN — cluster 3: per-language screenshot pages (long tail, high volume of small queries)

| # | Keyword | Intent | Target page | Why it can rank | Dur. |
|---|---|---|---|---|---|
| 15 | typescript code screenshot | transactional | `/code-screenshot/typescript` | Language+output modifier; low competition, and the page can show the real detection caveat | 🟢 |
| 16 | python code to image | transactional | `/code-screenshot/python` | Python is the highest-volume "paste my snippet" language | 🟢 |
| 17 | golang code screenshot | transactional | `/code-screenshot/go` | "golang" is the search form, "go" is the slug — the page must use both | 🟢 |
| 18 | rust code image generator | transactional | `/code-screenshot/rust` | Lifetimes and macros make rendering fiddly; that is the page's hook | 🟢 |
| 19 | sql query to image | transactional | `/code-screenshot/sql` | Queries get pasted into tickets and slides constantly | 🟢 |
| 20 | bash script to png | transactional | `/code-screenshot/shell` | Terminal output + script is a distinct visual genre | 🟢 |
| 21 | java code screenshot | transactional | `/code-screenshot/java` | Enterprise audience, annotations and generics | 🟢 |
| 22 | c# code to image | transactional | `/code-screenshot/csharp` | The `using System` / `namespace` detection is genuinely explainable | 🟢 |
| 23 | php snippet image | transactional | `/code-screenshot/php` | Niche but stable; the `function` detection clash is the differentiator | 🟢 |
| 24 | ruby code screenshot | transactional | `/code-screenshot/ruby` | Small volume, near-zero competition | 🟢 |

## EN — cluster 4: theming and typography (informational, feeds the blog)

| # | Keyword | Intent | Target page | Why it can rank | Dur. |
|---|---|---|---|---|---|
| 25 | best theme for code screenshots | informational | `/blog` | Answers with the 18 themes that actually ship, with light/dark guidance | 🟡 |
| 26 | jetbrains mono vs fira code ligatures | informational | `/blog` | Both are bundled fonts; the answer is checkable in the tool | 🟢 |
| 27 | code screenshot font size | informational | `/blog` | Real clamps (10–24, default 16) make the advice concrete | 🟢 |
| 28 | shiki themes list | informational | `/docs` | Names the 18 bundled ids, which is what people search for when wiring Shiki | 🟡 |
| 29 | code image for social media og | informational | `/docs` | The `og` 1200×630 ratio is a real preset | 🟢 |
| 30 | mcp server render code | informational | `/mcp` | Remote MCP endpoint exists; agent-side queries are rising | 🟡 |

## EN — cluster 5: AI agents

| # | Keyword | Intent | Target page | Why it can rank | Dur. |
|---|---|---|---|---|---|
| 31 | mcp server code screenshot | informational | `/mcp` | Agent builders search this exact phrase | 🟡 |
| 32 | let an ai agent render code images | informational | `/mcp` | Explains the remote endpoint and rate limits | 🟡 |
| 33 | api for code screenshots | commercial | `/docs` | Same intent as #8, resolved by the same page | 🟢 |

**EN total: 33 keywords across 5 clusters.**

---

## FR — cluster 1 : capture d'écran de code (transactionnel)

| # | Mot-clé | Intention | Page cible | Pourquoi elle peut se classer | Dur. |
|---|---|---|---|---|---|
| 1 | capture d'écran code | transactionnel | `/` | Forme française la plus courante ; le produit fait exactement ça | 🟢 |
| 2 | transformer code en image | transactionnel | `/` | Verbe d'action + résultat ; aucune ambiguïté d'intention | 🟢 |
| 3 | code en png | transactionnel | `/` | Format nommé, zéro installation requise | 🟢 |
| 4 | générateur d'image de code | transactionnel | `/` | Synonyme direct, même page, pas de cannibalisation | 🟢 |
| 5 | capture de code sans filigrane | transactionnel | `/pricing` | Le plan gratuit filigrane, le Pro non : la page assume le compromis | 🟡 |
| 6 | image de code 4x | transactionnel | `/pricing` | Le 4x est réservé au Pro, expliqué sur la page tarifs | 🟢 |
| 7 | exporter du code en pdf | transactionnel | `/` | Sortie PDF réelle, rare chez les concurrents | 🟢 |
| 8 | api capture de code | commercial | `/docs` | `/api/v1` documentée avec les limites (30/min gratuit, 300/min Pro) | 🟢 |

## FR — cluster 2 : alternatives (commercial)

| # | Mot-clé | Intention | Page cible | Pourquoi elle peut se classer | Dur. |
|---|---|---|---|---|---|
| 9 | alternative à ray.so | commercial | `/vs/ray-so` | Le chercheur connaît déjà l'outil ; comparer les mécaniques répond à sa question | 🟡 |
| 10 | alternative carbon.now.sh | commercial | `/vs/carbon` | Même logique, forte demande de remplacement | 🟡 |
| 11 | alternative snappify | commercial | `/vs/snappify` | Requête portée par le prix | 🟡 |
| 12 | comparatif outil capture de code | commercial | `/vs/ray-so` | La requête générique se range derrière une page comparatif | 🟡 |

## FR — cluster 3 : pages par langage (longue traîne)

| # | Mot-clé | Intention | Page cible | Pourquoi elle peut se classer | Dur. |
|---|---|---|---|---|---|
| 13 | capture code python | transactionnel | `/code-screenshot/python` | Langage + sortie, faible concurrence FR | 🟢 |
| 14 | capture code javascript | transactionnel | `/code-screenshot/typescript` | Le JS est couvert par la page TS (même outil, même page), à mentionner explicitement | 🟢 |
| 15 | capture code sql | transactionnel | `/code-screenshot/sql` | Requêtes collées dans les tickets et les slides | 🟢 |
| 16 | capture script bash | transactionnel | `/code-screenshot/shell` | Script + terminal = genre visuel distinct | 🟢 |
| 17 | capture code java | transactionnel | `/code-screenshot/java` | Public entreprise, annotations et génériques | 🟢 |
| 18 | capture code php | transactionnel | `/code-screenshot/php` | Volume modeste mais stable | 🟢 |
| 19 | capture code rust | transactionnel | `/code-screenshot/rust` | Quasi aucune concurrence francophone | 🟢 |
| 20 | capture code c# | transactionnel | `/code-screenshot/csharp` | Détection `using System` facile à expliquer | 🟢 |
| 21 | capture code go | transactionnel | `/code-screenshot/go` | « golang » et « go » à couvrir tous les deux | 🟢 |

## FR — cluster 4 : thèmes, polices, agents (informationnel)

| # | Mot-clé | Intention | Page cible | Pourquoi elle peut se classer | Dur. |
|---|---|---|---|---|---|
| 22 | meilleur thème pour capture de code | informationnel | `/blog` | Réponse appuyée sur les 18 thèmes réellement livrés | 🟡 |
| 23 | police pour code ligatures | informationnel | `/blog` | 7 polices embarquées, 3 avec ligatures : vérifiable dans l'outil | 🟢 |
| 24 | taille de police capture de code | informationnel | `/blog` | Bornes réelles (10–24, défaut 16) → conseil concret | 🟢 |
| 25 | générer une image de code avec une ia | informationnel | `/mcp` | Le serveur MCP distant existe ; requête en croissance | 🟡 |
| 26 | image de code pour réseaux sociaux | informationnel | `/docs` | Le ratio `og` 1200×630 est un preset réel | 🟢 |

**FR total : 26 keywords sur 4 clusters.**

---

## Sequencing (what to build first, and why)

1. `/code-screenshot/<language>` × 10 — highest ratio of (real product capability) to (competition),
   all evergreen, and they give the blog somewhere to link. Ship TypeScript, Python, SQL, Bash first:
   those four carry most of the tail.
2. `/vs/*` — three pages, only after each competitor has been re-checked live the same day. These are
   the 🟡 group; treat them as dated documents, not permanent claims.
3. `/blog` — needs the pillars from `article-ideas.md` to have anything worth linking to.
4. `/mcp` promotion in EN only for now; the FR agent query is real but thin.

## Cannibalisation rules

- One page per intent. "code to image" and "code screenshot generator" both resolve on `/`; do not
  create a second landing page for the synonym.
- `/vs/carbon` owns "carbon vs ray.so" framing; `/vs/ray-so` does not compete for it.
- French pages must not be machine-translated duplicates of the EN ones — same product facts,
  different worked examples, otherwise both lose.

## Re-check log (next review: 2027-02-15)

Re-verify: every 🟡 row, the competitor pages (live site, same day), MCP-related queries (agent
tooling moves fast), and the Shiki theme ids (an upstream rename would silently break `theme` values).
Leave the 🟢 language pages alone; they age well by design.