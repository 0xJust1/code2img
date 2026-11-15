import { APP_URL } from "@code2img/shared";

// One list, used by the landing (visible + FAQPage JSON-LD) and /pricing. Claims must stay true to the code.
export const FAQ = [
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

export function faqJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}