# Checklist de lancement

## MCP — publier `code2img-mcp` sur npm (fait le 15/11/2026, v0.1.0)

- [x] Créer un token **Automation** sur npmjs.com → Access Tokens, scope `code2img-mcp` (ou
  Full access si le paquet n'existe pas encore : le nom doit être réservé au premier publish).
- [x] `echo '//registry.npmjs.org/:_authToken=<TOKEN>' > ~/.npmrc` puis `npm whoami`.
- [x] `cd ~/projects/code2img && npm run pack:mcp && cd packages/mcp && npm publish --access public`.
- [x] Vérifier le paquet réellement publié : `npx -y --package code2img-mcp@0.1.0 code2img-mcp`
  + `node packages/mcp/scripts/stdio-smoke.mjs code2img-mcp` (6 checks).
- [x] Basculer les snippets sur le nom npm : `apps/web/app/mcp/page-html.ts`
  (`PKG` → `code2img-mcp`), `apps/web/app/llms.txt/route.ts`, `README.md`,
  `packages/mcp/README.md`, puis rebuild + restart du service web.

Notes :
- `0.0.0-stage` existe dans le registry mais n'est pas latest — ne pas unpublish, refusé aux tokens Automation.
- Le tarball `/downloads/code2img-mcp.tgz` reste servi comme alternative (auto-hébergement, air-gapped).

## Stripe live

Mode TEST uniquement dans le code déployé. Passage en live = go explicite de Justin
(clés live + `STRIPE_WEBHOOK_SECRET` via `stripe listen`).

## Légal / SEO — fait en Phase 6 (à relire avant le lancement public)

- [x] `/legal/terms` et `/legal/privacy` en ligne (rédigées depuis le code réellement déployé :
      export, partage, quotas, Stripe, sous-traitants). Chaque affirmation a été vérifiée contre
      le code : clés d'API stockées en sha256 (`src/lib/api/keys.ts`), aucun analytics ni
      publicité dans l'app, service de rendu non exposé (3002 en local seulement), export non
      connecté non conservé (`app/api/render/route.ts` n'écrit rien).
- [ ] **Compléter l'identité de l'éditeur avant le lancement public** : nom, adresse et SIREN/SIRET
      de l'EI (mentions légales obligatoires en France, art. 6 LCEN). Rien n'est inventé : les
      pages disent « Operator: Code2Img » et attendent ces trois valeurs de Justin.
- [x] `robots.txt`, `sitemap.xml` (25 URLs : pages réelles uniquement, hreflang EN/FR sur la
      landing et la tarification), `llms.txt`, JSON-LD (SoftwareApplication, Organization,
      FAQPage, BreadcrumbList) sur toutes les pages publiques.
- [x] OG dynamiques : `/api/og?title=…&sub=…` (rendu par le service du produit, 1200×630,
      fallback 302 vers `og.png` si le rendu échoue), branchés en `openGraph`/`twitter` sur
      les pages de contenu.
- [ ] **Vérifier les OG dans les crawlers réels** (X, LinkedIn, Slack) après le premier
      partage : les outils de prévisualisation ne lisent pas le même chemin que le navigateur.
- [ ] Pas d'enregistrement A IPv4 sur le domaine (Let's Encrypt est passé en IPv6) : un
      crawler d'aperçu en IPv4 seulement ne verra pas le site. À corriger côté DNS quand
      l'hébergeur le permettra.

## Délivrabilité mail (audit du 15/11/2026)

Magic links (`From: Code2Img <hello@code2img.app>`, serveur mail.vaultkeepr.xyz)
— état vérifié via mail-tester.com (test-2rtkg3tkj, 7.4/10) :

- Authentification parfaite : SPF pass, DKIM valid (2048, `d=code2img.app`),
  DMARC pass (`p=quarantine`), rDNS et MX corrects, IP 95.111.237.189 listée
  sur aucune des 20 blocklists.
- Score < 10 uniquement à cause de SpamAssassin `FROM_SUSPICIOUS_NTLD` (-2.5) :
  le TLD `.app` est un NTLD flaggé par SA. Aucune action possible sans changer
  de domaine — Gmail/Outlook n'utilisent pas cette règle.
- **Les mails peuvent atterrir dans le dossier Junk de l'utilisateur** : le
  filtre anti-junk côté client (Apple Mail en a été identifié le 15/11) déplace
  les messages vers le dossier Junk du serveur via IMAP. Ce n'est pas un
  problème serveur (aucun sieve, ni rspamd, ni cron sur mail.vaultkeepr.xyz).
  L'utilisateur doit marquer le mail « Not Junk » une fois ; l'UX /login
  affiche déjà l'erreur explicite si le lien a expiré (5 min).
- Reste à vérifier manuellement (nécessite de vrais comptes Gmail/Outlook) :
  la placement réel Inbox vs Junk chez Gmail et Outlook. Un test de placement
  (ex. EasyDMARC inbox placement) peut le faire sans comptes.

## Observabilité (optionnel, non installé)

Aucune télémétrie aujourd'hui : ni analytics, ni Sentry, ni Plausible (choix assumé, la
politique de confidentialité le dit). Si un jour : Plausible (sans cookie) pour le trafic,
Sentry pour les erreurs du service web et du rendu. Rien à préparer dans le code.

## Roadmap post-MVP

1. ~~Publier `code2img-mcp` sur npm~~ (fait le 15/11/2026, v0.1.0) — bascule des snippets en cours.
2. Les 8 idées d'articles restantes (`seo-content/article-ideas.md`) + les pages par langage
   déjà créées : c'est la croissance organique, pas de fonctionnalité à écrire.
3. Comptes OAuth (Google/GitHub) : le code est branché, il ne manque que les clés.
4. R2/S3 à la place du disque pour `SHARE_IMAGES_DIR` (un fichier `src/lib/storage.ts`).
5. Stripe live + webhook pointé dans le dashboard (go humain).