# Checklist Phase 1 — validation

## Fait (vérifié par exécution réelle sur cette machine)
- [x] Monorepo pnpm, TS strict, ESLint + typecheck verts sur les 6 projets
- [x] Éditeur : éditeur de code (textarea mono, Tab), aperçu temps réel (iframe = même builder que le serveur), détection auto du langage (16 langues), 18 thèmes Shiki, 7 polices monospace, ligatures on/off
- [x] Options carte : padding, rayon, ombre, fenêtre mac/windows/minimal/none, titre, numéros de ligne, surlignage de lignes, taille/interligne, largeur auto/fixe, ratio (auto, 1:1, 16:9, 4:5, OG 1200×630)
- [x] Backgrounds : 10 dégradés, unie, mesh (3 couleurs), motifs (dots/grid/stripes), transparent (PNG alpha vérifié)
- [x] Branding gratuit : auteur nom + lien
- [x] Presets sérialisés dans le hash d'URL (round-trip testé), copy link
- [x] Raccourcis clavier Ctrl/⌘+E / Ctrl/⌘+K ; labels, focus visible, responsive < 900 px
- [x] Pipeline unique `apps/render` : cache SHA-256, timeout 15 s, code ≤ 50 ko (schéma), sandbox double (réseau docker internal + page.route abort hors origine), watermark forcé côté serveur
- [x] Exports : PNG 1x–4x + transparent, JPG qualité, PDF (`page.pdf`) — tous testés en réel
- [x] Tests : 9 Vitest shared + 7 Vitest render (Chromium réel) + 1 E2E Playwright (éditeur → export PNG) — 17 verts
- [x] Smoke manuel : fonts 200, OG PNG 3600×1890 (3x), JPG 200
- [x] docker-compose (web + render + postgres + redis), `.env.example`, Dockerfiles

## Reste / à noter
- [ ] Docker non exécutable ici (pas de Docker sur cette box) : `docker compose config` à valider sur 192.168.1.45 — déploiement réel avec go humain.
- [ ] Drizzle + Better Auth : non câblés (Phase 2), Postgres provisionné mais vide.
- [ ] Éditeur de code = textarea (pas CodeMirror) ; upgrade si besoin UX en Phase 6.
- [ ] Les thèmes Shiki sont lazy-bundlés : le bundle éditeur embarque l'index complet (~ok en dev, à mesurer en prod).
- [ ] file BullMQ : testée par construction (même code path) mais non exécutée faute de Redis local — valider avec `REDIS_URL` au déploiement.
- [ ] Rate limit / quotas : Phase 2 (API).
