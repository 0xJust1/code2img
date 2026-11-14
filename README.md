# Code2Img — code to image (Phase 1 MVP)

Turn code snippets into pixel-perfect images (PNG / JPG / PDF) through ONE server-side
Playwright pipeline. Phase 1 scope: monorepo, editor, render service, docker-compose.
Auth/DB, Stripe, API, MCP, landing/SEO ship in Phases 2–7 (see `docs/checklist-phase1.md`).

## Stack

- **pnpm workspaces, TypeScript strict**, ESLint flat config, Vitest, Playwright (E2E)
- `packages/shared` — single source of truth: brand, config schema (zod, 50 KB code limit),
  language auto-detection, 18 Shiki themes, 7 monospace fonts, backgrounds, and
  **`buildCardHtml(config)`** — the pure HTML builder used by BOTH the editor preview (iframe)
  and the render service. What you see is what the server renders, by construction.
- `apps/render` — Fastify + Playwright Chromium. SHA-256 cache on the normalized config,
  15 s timeout, BullMQ queue when `REDIS_URL` is set (inline otherwise, same code path),
  self-hosted fonts, watermark forced server-side (`ENFORCE_WATERMARK=true`).
- `apps/web` — Next.js editor: live preview, all card options, URL-hash presets,
  keyboard shortcuts (`Ctrl/⌘+E` export, `Ctrl/⌘+K` copy link), WCAG AA focus styles.
- `packages/sdk`, `packages/mcp` — typed stubs for Phases 4–5 (monorepo shape kept).
- `node:crypto` SHA-256 hashing lives in `@code2img/shared/hash` (node-only subpath) so the
  browser bundle stays clean.

## Install & dev

```bash
pnpm install
pnpm dev          # web on :3000, render on :3002 (tsx watch)
open http://localhost:3000
```

Without Redis, renders run inline (dev-friendly). With Redis (`REDIS_URL=redis://localhost:6379`),
the same POST enqueues through BullMQ.

## Test

```bash
pnpm test   # shared (9) + render pipeline with real Chromium (7)
pnpm e2e    # editor -> live preview -> PNG export through /api/render
pnpm typecheck && pnpm lint
```

## Deploy (target: justin@192.168.1.45, Docker, pending human go)

```bash
cp .env.example .env   # set POSTGRES_PASSWORD
docker compose up -d --build
# web on :3000; appnet is internal (no outbound internet for Chromium),
# network sandbox is double-enforced in-page (page.route aborts non-self requests)
```

Render service: `POST /render` `{config, format: png|jpg|pdf, scale: 1-4, quality}`,
`GET /render/:presetB64url` (stateless OG/debug render), `GET /fonts/:file`, `GET /healthz`.

## Phase 2 notes

- Postgres + Redis are already provisioned in compose; DATABASE_URL is reserved.
- Prices are env-driven (`PRICE_*`); watermark removal is the first paid gate.

License note: inspired by ray.so (MIT © Raycast Technologies) — reimplementation, no ray.so
assets or branding. Brand constants live only in `packages/shared/src/brand.ts`.
