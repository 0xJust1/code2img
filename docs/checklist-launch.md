# Checklist de lancement

## MCP — publier `code2img-mcp` sur npm (2 min, compte personnel)

Reporté au 15/11/2026 : aucun token npm valide sur la box. En attendant, le paquet est
installé depuis le tarball servi par l'instance (`/downloads/code2img-mcp.tgz`,
régénéré par `npm run pack:mcp`).

1. Créer un token **Automation** sur npmjs.com → Access Tokens, scope `code2img-mcp` (ou
   Full access si le paquet n'existe pas encore : le nom doit être réservé au premier publish).
2. `echo '//registry.npmjs.org/:_authToken=<TOKEN>' > ~/.npmrc` puis `npm whoami`.
3. `cd ~/projects/code2img && npm run pack:mcp && cd packages/mcp && npm publish --access public`.
4. Vérifier le paquet réellement publié : `npx -y --package code2img-mcp@0.1.0 code2img-mcp`
   + `node packages/mcp/scripts/stdio-smoke.mjs code2img-mcp` (6 checks).
5. Basculer les snippets sur le nom npm une fois publié : `apps/web/app/mcp/page-html.ts`
   (`PKG` → `code2img-mcp`), `apps/web/app/llms.txt/route.ts`, `README.md`,
   `packages/mcp/README.md`, puis rebuild + restart du service web.

## Stripe live

Mode TEST uniquement dans le code déployé. Passage en live = go explicite de Justin
(clés live + `STRIPE_WEBHOOK_SECRET` via `stripe listen`).

## Légal / SEO

À traiter en Phase 6 (mentions légales, CGU/CGV, robots.txt, sitemap, JSON-LD).