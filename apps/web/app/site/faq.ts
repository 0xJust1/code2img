// One list per language, used by the landing, /pricing and their FAQPage JSON-LD.
// Claims must stay true to the code.
import { APP_URL } from "@code2img/shared";
import type { FaqItem } from "./shell";

export const FAQ_EN: FaqItem[] = [
  {
    q: "How do I turn code into an image?",
    a: "Paste the snippet into the editor, choose a theme and a font, then export. You get a PNG, JPG or PDF that keeps the padding, radius, background and window chrome you set. The same three steps run over HTTP: POST the config to /api/v1/images and read the bytes back.",
  },
  {
    q: "What can I export?",
    a: "PNG, JPG and PDF. The Free plan exports up to 2× the layout size, Pro up to 4× — enough for a retina screen or a 4K slide. Every export keeps the exact padding, radius, background and window chrome you set in the editor.",
  },
  {
    q: "Do I need an account?",
    a: "No. The editor works without signing in: paste code, export, or copy a share link. An account keeps your presets, your export history and your API keys, and Pro removes the watermark.",
  },
  {
    q: "How does the share link work?",
    a: `Each share creates a public page at ${APP_URL}/i/<slug> with the image, an Open Graph preview for X, LinkedIn and Farcaster, and a share bar. You can set an expiry and delete the link at any time.`,
  },
  {
    q: "Is there an API?",
    a: `Yes — ${APP_URL}/api/v1, with API keys, per-key scopes, quotas and signed image URLs. The OpenAPI spec is served at /api/v1/openapi.json and a TypeScript SDK covers the same endpoints. Free keys get 30 requests a minute and 500 a day; Pro keys 300 and 5.000.`,
  },
  {
    q: "Can my AI agent render images?",
    a: `Yes. There is a remote MCP server at ${APP_URL}/mcp (Streamable HTTP, authenticated with your API key) and a stdio package for Claude Code, Cursor and other local clients. Both call the same public API, so quotas and the watermark are applied once, in the same place.`,
  },
  {
    q: "Can I put my own logo or background on the card?",
    a: "On Pro: upload a PNG, JPG or WebP as the background, and a logo that sits in the card's corner. Free cards keep the Code2Img watermark and the built-in gradient, mesh and pattern backgrounds.",
  },
  {
    q: "What happens when I cancel?",
    a: "Pro stays active until the end of the period you paid for, then the account drops back to Free: the watermark returns, exports cap at 2× and presets above 10 stop syncing. Nothing is deleted, and your API keys keep working within the Free quotas.",
  },
];

export const FAQ_FR: FaqItem[] = [
  {
    q: "Comment transformer du code en image ?",
    a: "Collez l'extrait dans l'éditeur, choisissez un thème et une police, puis exportez. Vous obtenez un PNG, JPG ou PDF qui conserve le padding, le rayon, le fond et la barre de fenêtre réglés. Les trois mêmes étapes existent en HTTP : envoyez la configuration à /api/v1/images et récupérez les octets.",
  },
  {
    q: "Que puis-je exporter ?",
    a: "PNG, JPG et PDF. Le plan gratuit exporte jusqu'à 2× la taille de mise en page, Pro jusqu'à 4× — de quoi tenir sur un écran retina ou une diapositive 4K. Chaque export conserve exactement le padding, le rayon, le fond et la barre de fenêtre réglés dans l'éditeur.",
  },
  {
    q: "Faut-il un compte ?",
    a: "Non. L'éditeur fonctionne sans connexion : collez du code, exportez, ou copiez un lien de partage. Un compte conserve vos presets, votre historique d'exports et vos clés d'API ; Pro retire le filigrane.",
  },
  {
    q: "Comment fonctionne le lien de partage ?",
    a: `Chaque partage crée une page publique à ${APP_URL}/i/<slug> avec l'image, un aperçu Open Graph pour X, LinkedIn et Farcaster, et une barre de partage. Vous choisissez la date d'expiration et pouvez supprimer le lien à tout moment.`,
  },
  {
    q: "Y a-t-il une API ?",
    a: `Oui — ${APP_URL}/api/v1, avec des clés d'API, des scopes par clé, des quotas et des URLs d'image signées. La spécification OpenAPI est servie sur /api/v1/openapi.json et un SDK TypeScript couvre les mêmes endpoints. Les clés gratuites ont 30 requêtes par minute et 500 par jour ; les clés Pro 300 et 5 000.`,
  },
  {
    q: "Mon agent IA peut-il générer des images ?",
    a: `Oui. Un serveur MCP distant est disponible à ${APP_URL}/mcp (Streamable HTTP, authentifié avec votre clé d'API) et un paquet stdio existe pour Claude Code, Cursor et les autres clients locaux. Les deux appellent la même API publique : les quotas et le filigrane sont appliqués une seule fois, au même endroit.`,
  },
  {
    q: "Puis-je mettre mon logo ou mon fond sur la carte ?",
    a: "Avec Pro : téléchargez un PNG, JPG ou WebP comme fond, et un logo placé dans le coin de la carte. Les cartes gratuites gardent le filigrane Code2Img et les fonds dégradé, mesh et motifs intégrés.",
  },
  {
    q: "Que se passe-t-il si je résilie ?",
    a: "Pro reste actif jusqu'à la fin de la période payée, puis le compte repasse en gratuit : le filigrane revient, les exports plafonnent à 2× et les presets au-delà de 10 cessent de se synchroniser. Rien n'est supprimé et vos clés d'API continuent de fonctionner dans les quotas gratuits.",
  },
];
