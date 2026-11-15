# Code2Img — code to image

Turn code snippets into pixel-perfect images (PNG / JPG / PDF) through ONE server-side
Playwright pipeline. Phase 3 adds: public share pages `/i/[slug]` with Open Graph /
Twitter / Farcaster metadata, expiring and owner-deletable links, UTM tracking and a
multi-network share bar — the code itself is never stored.

## Stack

- **pnpm workspaces, TypeScript strict**, ESLint flat config, Vitest, Playwright (E2E)
- `packages/shared` — brand, config schema (zod, 50 KB code), thèmes/polices, backgrounds,
  `buildCardHtml(config)`, **entitlements** (`can`, `maxScale`, `effectivePlan` avec grâce).
  Utilisé par l'éditeur ET le service de rendu : un seul pipeline, WYSIWYG par construction.
- `packages/db` — schéma Drizzle (users/Better Auth, api_keys, images, share_links,
  presets, uploads, usage_counters, webhook_events) + migrations SQL (`drizzle/`) +
  helpers PGlite (tests). Lazy : sans `DATABASE_URL` l'app tourne en mode Phase 1.
- `apps/render` — Fastify + Playwright Chromium. Cache SHA-256, timeout 15 s, BullMQ
  optionnel. **Trust boundary** : un header `x-internal-token` (match `RENDER_INTERNAL_TOKEN`)
  active le mode Pro ; sans token, watermark forcé, scale plafonné à 2x, uploads ignorés.
- `apps/web` — Next.js : éditeur, `/login` (magic link), `/dashboard` (presets, assets,
  facturation, export RGPD, suppression de compte), routes API (render, uploads, presets,
  billing, webhooks Stripe, me).

## Install & dev

```bash
pnpm install
pnpm dev          # web :3000, render :3002 (tsx watch)
pnpm test         # shared (16) + render (10) + web stripe/auth (7) — PGlite, aucun serveur requis
pnpm typecheck && pnpm lint
```

## Postgres natif (sur 1.45, pas de Docker)

Procédure de provisioning (à exécuter en tant qu'admin sur 1.45) :

```bash
sudo -u postgres psql <<'SQL'
CREATE ROLE code2img LOGIN PASSWORD '<mot-de-passe-généré>';
CREATE DATABASE code2img OWNER code2img;
SQL
# puis migrer :
psql "postgres://code2img:<mdp>@127.0.0.1:5432/code2img" -f packages/db/drizzle/0000_*.sql
```

Ensuite renseigner `DATABASE_URL` dans l'environnement des services (voir unit systemd).
Tant qu'il est absent : auth/billing/dashboard répondent 503, l'éditeur Phase 1 fonctionne.

## Déploiement natif (192.168.1.45)

Services systemd user (+ linger) : `code2img-web.service` (port **3335**),
`code2img-render.service` (port **3002**). Déploiement = rsync/tar du repo →
`pnpm install` → `pnpm --filter @code2img/web build` → `systemctl --user restart code2img-*`.

Secrets : `AUTH_SECRET`, `RENDER_INTERNAL_TOKEN`, `DATABASE_URL` (+ Stripe test).
Voir `.env.example`.

## Stripe (mode test uniquement — live = go humain)

```bash
stripe login
stripe listen --forward-to localhost:3335/api/webhooks/stripe   # récupère whsec_...
# créer les prix :
stripe prices create --unit-amount=700 --currency=eur --recurring=interval=month ...
```

Prix en env : `STRIPE_PRICE_PRO_MONTHLY` (7 €/mois), `STRIPE_PRICE_PRO_YEARLY` (59 €/an).
Checkout : `automatic_tax` (Stripe Tax) + Portal. Webhooks : signature vérifiée,
idempotence via `webhook_event`, `past_due` → 3 jours de grâce puis downgrade
(watermark revient automatiquement via `effectivePlan`), 5 échecs → dead-letter.

## API render

`POST /render` `{config, format: png|jpg|pdf, scale: 1-4, quality, attachments?}`,
`GET /render/:presetB64url` (stateless, free tier), `GET /fonts/:file`, `GET /healthz`.
Le watermark/scale/uploads sont appliqués **dans le pipeline serveur**, jamais côté client.

## Partage public (Phase 3) — `/i/[slug]`

Un rendu unique (`@/lib/render`, mêmes entitlements que l'export) → image stockée sur
le disque du host web, le code n'est **jamais** persisté (ni `images.config`, ni le hash
du code : seul un hash de la config visuelle, code vidé).

- `POST /api/share` `{config, format, scale, quality, expiry: "1d"|"7d"|"30d"|"never", utm?}`
  → `{slug, url, path, expiresAt}` (session requise). Défaut : 7 jours.
- `DELETE /api/share/[slug]` — propriétaire uniquement (soft delete + suppression des bytes).
- `GET /i/[slug]/image` — image publique ; 404 dès que le lien est expiré ou supprimé.
- Page `/i/[slug]` : Open Graph `summary_large_image`, Twitter Card, `fc:frame`
  (Farcaster/Warpcast, version `next`) et barre de partage (X, LinkedIn, Facebook,
  Mastodon avec instance mémorisée, Farcaster, Reddit, Bluesky, Threads, Hacker News,
  Telegram, WhatsApp, email, copier, Web Share API). Chaque lien réseau ajoute
  `utm_source=<réseau>&utm_medium=social[&utm_campaign=…]`.

Stockage : `apps/web/src/lib/storage.ts` (3 fonctions `put/get/delete` sur
`SHARE_IMAGES_DIR`, défaut `apps/web/data/share`) — forme objet, R2/S3 se branche là.
Les URLs absolues (OG, image) viennent de `APP_URL`.

### Tests

```bash
pnpm test                                  # unitaires (PGlite) — dont tests/share.test.ts
E2E_DATABASE_URL=postgres://…/code2img_e2e pnpm --filter @code2img/web e2e
```

Les specs de page publique se **skippent** sans `E2E_DATABASE_URL` (l'éditeur, lui, n'a
pas besoin de Postgres). Base de test, une fois :

```bash
sudo -u postgres createdb -O code2img code2img_e2e
psql "postgres://code2img:***@127.0.0.1:5432/code2img_e2e" -f packages/db/drizzle/0000_*.sql
```

## API publique `/api/v1` (Phase 4)

Base : `https://code2img.app/api/v1` (spec publiée sur `/api/v1/openapi.json`, doc interactive
sur `/docs`, client typé `@code2img/sdk`).

```bash
# clé : dashboard → "Create API key" (affichée une seule fois, stockée hachée sha256)
curl -X POST https://code2img.app/api/v1/images \
  -H "authorization: Bearer c2i_live_xxx" -H "content-type: application/json" \
  -o card.png -d '{"code":"console.log(1)","theme":"dracula","format":"png"}'
```

```ts
import { Code2Img } from "@code2img/sdk";
const c2i = new Code2Img({ apiKey: process.env.CODE2IMG_KEY! });
const png = await c2i.render({ code: "console.log(1)", theme: "dracula" });   // Uint8Array
const { url } = await c2i.createImage({ code: "npm i code2img", bg: "sunset" }); // lien 30 j
```

| Endpoint | Auth | Rôle |
|---|---|---|
| `POST /v1/images` | clé, scope `write` | rendu : `response_type=binary` (défaut) ou `url` (persisté 30 j). `Idempotency-Key` supporté |
| `GET /v1/images/{id}` | aucune | télécharge une image persistée (uuid = capacité) |
| `DELETE /v1/images/{id}` | clé, `write` | supprime l'image (propriétaire) |
| `GET /v1/themes\|languages\|fonts\|backgrounds` | aucune | catalogues |
| `GET /v1/usage` | clé, `read` | compteurs du jour + quotas + clés actives |
| `POST /v1/uploads` | clé, `upload` + Pro | logo / fond (2 Mo, png/jpeg/webp vérifiés par magic bytes) |
| `POST /v1/signed-url` | clé, `write` | fabrique une URL `render.png` signée |
| `GET /v1/render.png?code=…&sig=…` | signature | badge embarquable, sans clé au chargement |

Décisions et garde-fous :

- **Clés** : `c2i_live_<8 hex>_<secret>` — seul `sha256(clé)` est stocké, préfixe lisible pour
  l'affichage ; rotation = nouvelle clé + ancienne révoquée immédiatement ; scopes `read`/`write`/`upload`.
- **Quotas** : par clé et par IP, fenêtres fixes 60 s / 24 h — Free 30/min · 500/j,
  Pro 300/min · 5000/j (`API_LIMITS` dans `@code2img/shared/entitlements`). Redis natif sur
  1.45 (`REDIS_URL`, défaut prod `redis://127.0.0.1:6379`, compteurs persistants ; sans Redis
  joignable : compteurs en mémoire). Réponses 429 en problem+json + `X-RateLimit-*` + `Retry-After`.
- **Erreurs** : RFC 9457 `application/problem+json` (`type|title|status|detail`) partout.
- **Idempotence** : table `idempotency_key` (unique par compte+clé, TTL 24 h) ; même clé + même
  corps → réponse rejouée, même clé + corps différent → 422.
- **Confidentialité** : le code n'est jamais persisté (ni `images.config`, ni hash du code —
  hash de la config visuelle, code vidé), comme pour les liens publics.
- **Signature `render.png`** : HMAC-SHA256 sur les paramètres allowlistés (clé =
  `RENDER_SIGN_SECRET`, à défaut `AUTH_SECRET` — aucun secret en plus à provisionner),
  **sans expiration** (un badge README doit rester valide) — la signature fige un snippet précis,
  c'est ce qui borne l'abus ; le reste est limité par IP.
- **Sécurité** : code ≤ 50 Ko (schéma zod partagé), timeout du rendu 15 s côté service,
  Chromium sandboxé sans accès réseau externe (polices auto-hébergées), aucune URL fournie par
  l'utilisateur n'est jamais chargée par le serveur (pas de surface SSRF), watermark forcé
  côté serveur en Free.

Contrat vérifié : `apps/web/tests/api.test.ts` (clés, quotas, erreurs, idempotence, signature,
images, compteurs + cohérence OpenAPI ↔ SDK ↔ fichiers de route) et
`scripts/api-contract.mjs` (bout-en-bout sur l'instance déployée).

```bash
BASE_URL=http://192.168.1.45:3335 API_KEY=c2i_live_… node scripts/api-contract.mjs
```

License note: inspired by ray.so (MIT © Raycast Technologies) — reimplementation, no ray.so
assets or branding. Brand constants live only in `packages/shared/src/brand.ts`.
