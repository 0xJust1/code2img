import type { Metadata } from "next";
import { APP_NAME, APP_URL, THEMES, FONTS, LANGUAGES } from "@code2img/shared";
import { Wordmark } from "./brand";
import DemoIsland from "./demo-island";
import PriceToggle from "./price-toggle";
import { FAQ, faqJsonLd } from "./faq";
import "./landing.css";

const monthly = Number(process.env.PRICE_PRO_MONTHLY_EUR ?? 7);
const yearly = Number(process.env.PRICE_PRO_YEARLY_EUR ?? 59);

export const metadata: Metadata = {
  title: `${APP_NAME} — turn code into an image`,
  description:
    "Paste a snippet, pick a theme, export a pixel-perfect PNG, JPG or PDF. Share a public link, or render it from the API and from your AI agent.",
  alternates: { canonical: "/" },
  openGraph: {
    url: "/",
    title: `${APP_NAME} — turn code into an image`,
    description: "Paste a snippet, pick a theme, export a pixel-perfect PNG. Then share it, or render it from the API.",
    images: [{ url: "/og.png", width: 1200, height: 630 }],
  },
  twitter: { card: "summary_large_image", images: ["/og.png"] },
};

const GALLERY = [
  { file: "example-tokyo", theme: "tokyo-night", title: "deploy.sh" },
  { file: "example-latte", theme: "catppuccin-latte", title: "App.tsx" },
  { file: "example-rose", theme: "rose-pine", title: "query.sql" },
  { file: "example-nord", theme: "nord", title: "main.go" },
  { file: "example-dracula", theme: "dracula", title: "train.py" },
  { file: "example-min", theme: "min-light", title: "notes.rs" },
];

const apiSnippet = `curl -X POST ${APP_URL}/api/v1/images \\
  -H "Authorization: Bearer c2i_sk_…" \\
  -H "content-type: application/json" \\
  -d '{"config":{
        "code":"print(\\"hi\\")",
        "language":"python",
        "theme":"tokyo-night"}}' \\
  --output card.png`;

const mcpSnippet = `{
  "mcpServers": {
    "code2img": {
      "type": "http",
      "url": "${APP_URL}/mcp",
      "headers": { "Authorization": "Bearer c2i_sk_…" }
    }
  }
}`;

export default function Landing() {
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: APP_NAME,
      applicationCategory: "DeveloperApplication",
      operatingSystem: "Web",
      url: APP_URL,
      description: "Turn code snippets into pixel-perfect images, shareable links, an API and an MCP server for AI agents.",
      offers: [
        { "@type": "Offer", price: "0", priceCurrency: "EUR", name: "Free" },
        { "@type": "Offer", price: String(monthly), priceCurrency: "EUR", name: "Pro monthly" },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: APP_NAME,
      url: APP_URL,
      logo: `${APP_URL}/brand/icon-512.png`,
    },
    faqJsonLd(),
  ];

  return (
    <div className="mk">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <header className="mk-nav">
        <div className="mk-wrap">
          <Wordmark />
          <nav className="mk-links" aria-label="Main">
            <a href="#features">Features</a>
            <a href="/pricing">Pricing</a>
            <a href="/docs">API</a>
            <a href="/mcp">MCP</a>
            <a className="btn btn-primary btn-lg" href="/editor">
              Open the editor
            </a>
          </nav>
        </div>
      </header>

      <section className="mk-hero">
        <div className="mk-wrap">
          <div className="mk-hero-top">
            <h1>Code in, image out.</h1>
            <div>
              <p className="mk-lead">
                Paste a snippet, pick a theme, export a pixel-perfect PNG in seconds. Share a link, or render it from the API
                and from your AI agent.
              </p>
              <div className="mk-actions">
                <a className="btn btn-primary btn-lg" href="/editor">
                  Open the editor
                </a>
                <a className="btn btn-lg" href="/docs">
                  Read the API
                </a>
              </div>
            </div>
          </div>
          <figure className="mk-shot">
            <link rel="preload" as="image" href="/examples/hero.jpg" fetchPriority="high" />
            {/* a static JPEG, not a next/image candidate: no layout shift, no loader */}
            <img
              src="/examples/hero.jpg"
              srcSet="/examples/hero-sm.jpg 544w, /examples/hero.jpg 1088w"
              sizes="(max-width: 760px) 92vw, 620px"
              alt="A rendered code card: the file cart.ts in the github-dark theme on a midnight gradient, with macOS window controls and a line-number gutter"
              width={1088}
              height={780}
              fetchPriority="high"
            />
            <figcaption>cart.ts, github-dark, exported at 2× from the editor.</figcaption>
          </figure>
        </div>
      </section>

      <section className="mk-demo mk-sec" id="demo">
        <div className="mk-wrap" data-reveal-group>
          <div>
            <h2 data-reveal>Render one right here.</h2>
            <p className="tight" data-reveal>
              This box is the real pipeline, not a picture: your snippet goes to the render service and comes back as a PNG,
              with the watermark the Free plan carries.
            </p>
          </div>
          <div data-reveal>
            <DemoIsland />
          </div>
        </div>
      </section>

      <section className="mk-sec" id="examples">
        <div className="mk-wrap" data-reveal-group>
          <h2 data-reveal>
            {THEMES.length} themes, {FONTS.length} code fonts, every export.
          </h2>
          <p className="tight" data-reveal>
            Six of them, rendered by the product itself at 2×.
          </p>
          <div className="gal" style={{ marginTop: "var(--s6)" }}>
            {GALLERY.map((g) => (
              <figure key={g.file} data-reveal>
                <img
                  src={`/examples/${g.file}.jpg`}
                  alt={`Code card rendered in the ${g.theme} theme: ${g.title}`}
                  width={2560}
                  height={1440}
                  loading="lazy"
                />
                <figcaption>
                  {g.theme} · {g.title}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section className="mk-sec" id="features">
        <div className="mk-wrap feat" data-reveal-group>
          <div>
            <h2 data-reveal>Built for the way code gets shared.</h2>
            <ul className="feat-list">
              <li data-reveal>
                <h3>Share links that preview properly</h3>
                <p>
                  Every export can become a public page with its own OG image, so a pasted link shows the card in X,
                  LinkedIn, Slack and Farcaster. Links expire on your terms and can be deleted.
                </p>
              </li>
              <li data-reveal>
                <h3>Exports that survive a slide and a retina screen</h3>
                <p>
                  PNG, JPG and PDF up to 2× on Free and 4× on Pro, with the layout you set: padding, radius, window chrome,
                  a fixed or automatic width, and 1:1, 16:9, 4:5 or an OG crop.
                </p>
              </li>
              <li data-reveal>
                <h3>One render pipeline, three doors</h3>
                <p>
                  The editor, the REST API and the MCP server all call the same service. What you see in the preview is what
                  a client gets back — the same themes, the same limits.
                </p>
              </li>
              <li data-reveal>
                <h3>Backgrounds and branding</h3>
                <p>
                  Gradients, mesh, patterns, a flat colour or your own image, plus a logo in the card corner on Pro. The
                  watermark disappears when you pay for it.
                </p>
              </li>
            </ul>
          </div>
          <div data-reveal>
            <img
              src="/examples/example-rose.jpg"
              alt="A code card for query.sql rendered in the rose-pine theme on a dark background"
              width={2560}
              height={1440}
              loading="lazy"
              style={{ width: "100%", height: "auto", borderRadius: "var(--r-panel)" }}
            />
          </div>
        </div>
      </section>

      <section className="mk-sec dev" id="developers">
        <div className="mk-wrap" data-reveal-group>
          <h2 data-reveal>An endpoint, and an MCP server.</h2>
          <p className="tight" data-reveal>
            {LANGUAGES.length} languages are recognised automatically. Send a config, get bytes back; the same call is
            available to an agent over MCP.
          </p>
          <div className="dev-grid" style={{ marginTop: "var(--s6)" }}>
            <div data-reveal>
              <p className="cap">REST — one request, one PNG</p>
              <pre>
                <code>{apiSnippet}</code>
              </pre>
            </div>
            <div data-reveal>
              <p className="cap">MCP — remote Streamable HTTP</p>
              <pre>
                <code>{mcpSnippet}</code>
              </pre>
            </div>
          </div>
          <p className="tight" data-reveal style={{ marginTop: "var(--s5)" }}>
            Keys carry scopes and quotas; signed URLs let a browser fetch a render without the key. The OpenAPI spec is at{" "}
            <a href="/api/v1/openapi.json">/api/v1/openapi.json</a>; setup notes are in the <a href="/docs">API reference</a>{" "}
            and on the <a href="/mcp">MCP page</a>.
          </p>
        </div>
      </section>

      <section className="mk-sec" id="pricing">
        <div className="mk-wrap" data-reveal-group>
          <div className="price-head">
            <h2 data-reveal style={{ margin: 0 }}>
              Free to use. {monthly} € a month to make it yours.
            </h2>
          </div>
          <div data-reveal style={{ marginTop: "var(--s6)" }}>
            <PriceToggle monthly={monthly} yearly={yearly} />
          </div>
          <p className="tight" data-reveal style={{ marginTop: "var(--s4)" }}>
            Paid on Stripe and cancellable from the dashboard; the Free plan needs no card.
          </p>
        </div>
      </section>

      <section className="mk-sec" id="faq">
        <div className="mk-wrap" data-reveal-group>
          <div className="faq-grid">
            <h2 data-reveal>Questions people actually ask.</h2>
            <div className="faq">
              {FAQ.map((f) => (
                <details key={f.q} data-reveal>
                  <summary>{f.q}</summary>
                  <p>{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>

      <footer className="mk-foot">
        <div className="mk-wrap">
          <p className="big">Code2Img</p>
          <div className="cols">
            <nav aria-label="Product">
              <a href="/editor">Editor</a>
              <a href="/pricing">Pricing</a>
              <a href="/dashboard">Dashboard</a>
            </nav>
            <nav aria-label="Developers">
              <a href="/docs">API reference</a>
              <a href="/mcp">MCP server</a>
              <a href="/api/v1/openapi.json">OpenAPI spec</a>
              <a href="/llms.txt">llms.txt</a>
            </nav>
            <nav aria-label="Contact">
              <a href="mailto:hello@code2img.app">hello@code2img.app</a>
              <a href="mailto:support@code2img.app">support@code2img.app</a>
            </nav>
          </div>
          <p className="legal">
            © {new Date().getFullYear()} {APP_NAME}. An independent product, not affiliated with any other screenshot tool.
          </p>
        </div>
      </footer>
    </div>
  );
}