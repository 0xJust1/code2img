# Spec — Export animé (typewriter) SANS GIF

Statut : spec (pas d'implémentation). Périmètre corrigé du 15/11 : l'export animé est voulu, seul le **format GIF est exclu**. Cibles : **WebM (VP9)** en primaire, **MP4** et **APNG** en option.

## 1. Faisabilité du pipeline actuel (Playwright) — vérifiée par spike réel

Le pipeline actuel (`apps/render/src/render.ts`) : HTML de carte construit côté serveur (`buildCardHtml`, Shiki `codeToHtml` dans `@code2img/shared/card.ts`), Chromium headless, screenshot de `#capture`. Le rendu animé réutilise tout : il ne change que la capture.

**Spike exécuté (15/11, Chromium réel sur la box, non commité)** :
- carte Shiki rendue une fois, reveal typewriter en **pur CSS** (`@keyframes` sur la largeur, `steps()`), enregistré via `context(recordVideo)` ;
- résultat : `WebM VP9 688×220, 4,12 s` pour une anim de ~3 s — en temps réel, ~35 s CPU wall total.
- Conclusion : **faisable sans nouvelle dépendance Node** (Playwright enregistre la vidéo nativement). L'encodage se fait dans le navigateur (Pas de ffmpeg requis pour WebM ; ffmpeg 9.0.1 est présent sur la box si besoin de MP4).

Limites de `recordVideo` :
- Enregistre **la page entière, pas l'élément** → il faut dimensionner le viewport exactement sur `#capture` (mesurer la bounding box, viewport = taille arrondie au nombre pair). Pas de cropping post-hoc nécessaire si on fait ça.
- **FPS non configurable** (~25 fps, contrôlé par le screencast interne de Chromium). Suffisant pour un typewriter. Si 30/60 fps voulu plus tard : `Page.startScreencast` (CDP) frames par frames + ffmpeg — pas maintenant.
- Durée : l'enregistrement dure le temps réel de l'animation (pas de time-lapse gratuit). Une anim de 5 s = ~5-6 s de worker occupé.

## 2. Coût CPU : recalcul Shiki par frame vs reveal CSS

| Approche | Shiki | Coût réel |
|---|---|---|
| A. Recalcul Shiki par frame (headless screenshots + assemblage) | 1×/frame — ~60 frames pour 3 s à 20 fps | Énorme et inutile : chaque frame = reload fonts + re-parse, minutes de CPU pour 3 s de vidéo. Écarté. |
| B. **Reveal progressif CSS, une seule capture vidéo** (recommandée) | **1×** total | Le typewriter = animation CSS (largeur réelle du bloc de code, `steps(N)` où N = nb de caractères). Chromium peint les frames pendant l'enregistrement. Mesuré : ~1,2× temps réel de CPU. Une anim 5 s ≈ 6 s de worker. |

Le recalcul Shiki par frame n'apporte rien : le typewriter est un reveal de pixels, pas un re-coloriage. La variante « caret qui tape caractère par caractère avec coloriage partiel » se fait aussi en CSS/JS côté page (masque par caractère) sans retoucher Shiki.

## 3. Limites Free / Pro

Alignées sur le tier existant (`parseRenderBody`, forçage serveur) :

| | Free | Pro (token interne) |
|---|---|---|
| Format animé | WebM only, **watermark forcé** (déjà forcé dans la config), scale 1-2 | WebM + MP4 + APNG, sans watermark, scale libre |
| Durée max anim | **5 s** (cap serveur, sinon rejet) | **15 s** |
| FPS | ~25 (imposé par recordVideo) | idem (mécanique) |
| Taille vidéo | ~0,5-2 Mo pour 5 s 720p (VP9) | idem, quelques Mo |
| Cache | clé de cache = hash(config + format + dur_settings), TTL 24 h — réutiliser `requestKey` tel quel en ajoutant le format | idem |

Le cap de durée et le watermark sont appliqués dans `parseRenderBody` (trusted=false), comme le scale et les attachments aujourd'hui : pas de contournement côté client.

## 4. Place dans l'UI

- Éditeur (`apps/web/app/editor`) : bouton « Export animé » à côté de l'export actuel. Une fois cliqué : petit panneau avec durée (slider 2-15 s, borné par tier) et vitesse typewriter → POST au render avec `format: "webm"`, `anim: { type: "typewriter", durationMs }`.
- Le résultat est un téléchargement de fichier (comme PNG aujourd'hui), pas un blob affiché.
- Pas d'aperçu live de l'animation dans l'éditeur en V1 : la preview iframe peut jouer la même animation CSS localement à coût nul si trivial, sinon V2.
- Validation : `format: "webm" | "mp4" | "apng"` ajouté à `Format` + `anim` optionnel dans `RenderRequest` (schema zod côté shared), rejeté si format animé + durée > cap du tier.

## 5. Impact perf landing

**Aucun chargement de lib d'animation sur la landing.** Le typewriter est généré côté serveur (dans le HTML de carte rendu par `buildCardHtml`) — la landing n'embarque rien. Si la landing veut montrer une démo animée : une `<video autoplay muted loop>` WebM pré-générée (lazy, `preload="none"` ou lazy via IntersectionObserver), pas de JS d'anim. La lib `shiki` déjà présente côté shared ne bouge pas.

## 6. Recommandation

**Option B : typewriter CSS + `recordVideo` WebM, MP4 via ffmpeg en option Pro.** Une seule nouvelle brique (formater `anim` dans `RenderRequest` + wrapper de capture vidéo dans `render.ts`), zéro nouvelle dépendance Node pour le chemin WebM, coût worker ~1,2× temps réel, watermark/durée déjà garantis par le tier serveur. APNG : ne pas le faire (frames PNG + assemblage = le chemin coûteux de l'option A pour un format moins utilisé que WebM).

Estimations :
- WebM Free+Pro (typewriter CSS, viewport fit à `#capture`, cap durée) : **~1-1,5 j**
- MP4 via ffmpeg (spawn ffmpeg, transcode WebM→H.264, Pro only) : **~0,5 j**
- UI éditeur (bouton + panneau durée/vitesse) : **~0,5 j**
- Tests (vitest render : 1 anim réelle assertée via ffprobe/ffprobe-less check magic bytes + durée) : **~0,5 j**

Total : **~2,5-3 j**. Livrable en 2 PRs : (1) format animé serveur + tests, (2) UI éditeur.
