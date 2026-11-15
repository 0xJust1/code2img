import type { Metadata } from "next";
import { APP_NAME } from "@code2img/shared";
import { Wordmark } from "../brand";
import PriceToggle from "../price-toggle";
import { FAQ, faqJsonLd } from "../faq";
import "../landing.css";

const monthly = Number(process.env.PRICE_PRO_MONTHLY_EUR ?? 7);
const yearly = Number(process.env.PRICE_PRO_YEARLY_EUR ?? 59);

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Code2Img is free to use. Pro removes the watermark, raises exports to 4×, unlocks your own logo and backgrounds and lifts the API quota.",
  alternates: { canonical: "/pricing" },
  openGraph: { url: "/pricing", title: `Pricing — ${APP_NAME}` },
};

const ROWS: { label: string; free: string; pro: string }[] = [
  { label: "Export formats", free: "PNG, JPG, PDF", pro: "PNG, JPG, PDF" },
  { label: "Export scale", free: "up to 2×", pro: "up to 4×" },
  { label: "Watermark", free: "code2img.app", pro: "none" },
  { label: "Themes and fonts", free: "all", pro: "all" },
  { label: "Backgrounds", free: "gradients, mesh, patterns, solid", pro: "+ your own image" },
  { label: "Logo in the card corner", free: "no", pro: "yes" },
  { label: "Saved presets", free: "10", pro: "unlimited" },
  { label: "Share links with OG image", free: "yes", pro: "yes" },
  { label: "REST API", free: "30 a minute, 500 a day", pro: "300 a minute, 5.000 a day" },
  { label: "MCP server (remote and stdio)", free: "yes", pro: "yes" },
];

export default function Pricing() {
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: APP_NAME,
      applicationCategory: "DeveloperApplication",
      operatingSystem: "Web",
      offers: [
        { "@type": "Offer", price: "0", priceCurrency: "EUR", name: "Free" },
        { "@type": "Offer", price: String(monthly), priceCurrency: "EUR", name: "Pro monthly" },
        { "@type": "Offer", price: String(yearly), priceCurrency: "EUR", name: "Pro annual" },
      ],
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
            <a href="/#features">Features</a>
            <a href="/#examples">Examples</a>
            <a href="/docs">API</a>
            <a href="/mcp">MCP</a>
            <a className="btn btn-primary btn-lg" href="/editor">
              Open the editor
            </a>
          </nav>
        </div>
      </header>

      <section className="mk-hero">
        <div className="mk-wrap" data-reveal-group>
          <div>
            <h1 data-reveal>One price, no tiers to decode.</h1>
            <p className="mk-lead" data-reveal>
              The editor is free and stays free. Pro is {monthly} € a month — or {yearly} € a year — and changes four
              things: the watermark, the export scale, your own branding, and the API quota.
            </p>
          </div>
          <figure className="mk-shot" data-reveal>
            <img
              src="/examples/hero.jpg"
              alt="A code card rendered by the app: cart.ts in the github-dark theme on a midnight gradient"
              width={1088}
              height={780}
            />
            <figcaption>The card from the hero, rendered by the same service a paying account calls.</figcaption>
          </figure>
        </div>
      </section>

      <section className="mk-sec" aria-labelledby="what-you-get">
        <div className="mk-wrap" data-reveal-group>
          <h2 id="what-you-get" data-reveal>The same card, at three themes and two scales.</h2>
          <p className="tight" data-reveal style={{ marginTop: "var(--s4)" }}>
            Free exports this card at up to 2× with a small watermark; Pro removes the watermark and goes to 4×. Everything
            else — themes, fonts, backgrounds, share links — is in both plans.
          </p>
          <div className="mk-strip" data-reveal>
              <figure>
                <img
                  src="/examples/example-tokyo.jpg"
                  alt="A code card rendered in the tokyo-night theme on a midnight gradient"
                  width={1280}
                  height={720}
                />
                <figcaption>tokyo-night · PNG 2×</figcaption>
              </figure>
              <figure>
                <img
                  src="/examples/example-dracula.jpg"
                  alt="A code card rendered in the dracula theme on a violet gradient"
                  width={1280}
                  height={720}
                />
                <figcaption>dracula · PNG 4× on Pro</figcaption>
              </figure>
              <figure>
                <img
                  src="/examples/example-min.jpg"
                  alt="A code card rendered in the min-light theme on a flat light background"
                  width={1280}
                  height={720}
                />
                <figcaption>min-light · PDF on Pro</figcaption>
              </figure>
          </div>
        </div>
      </section>

      <section className="mk-sec">
        <div className="mk-wrap" data-reveal-group>
          <h2 data-reveal>Pick a plan.</h2>
          <div data-reveal style={{ marginTop: "var(--s5)" }}>
            <PriceToggle monthly={monthly} yearly={yearly} />
          </div>

          <div data-reveal style={{ marginTop: "var(--gap-section)" }}>
            <h2>What changes between the two.</h2>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "var(--fs-lg)", marginTop: "var(--s5)" }}>
              <thead>
                <tr style={{ textAlign: "left", color: "var(--ink-3)", fontSize: "var(--fs-body)" }}>
                  <th style={{ padding: "10px 0", fontWeight: 500 }}> </th>
                  <th style={{ padding: "10px 0", fontWeight: 500 }}>Free</th>
                  <th style={{ padding: "10px 0", fontWeight: 500 }}>Pro</th>
                </tr>
              </thead>
              <tbody>
                {ROWS.map((r) => (
                  <tr key={r.label}>
                    <th scope="row" style={{ padding: "12px 16px 12px 0", textAlign: "left", fontWeight: 400, color: "var(--ink-2)" }}>
                      {r.label}
                    </th>
                    <td style={{ padding: "12px 16px 12px 0", color: "var(--ink-2)" }}>{r.free}</td>
                    <td style={{ padding: "12px 0", color: "var(--ink)" }}>{r.pro}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="mk-sec" style={{ background: "var(--surface)" }}>
        <div className="mk-wrap faq-grid" data-reveal-group>
          <h2 data-reveal>Questions about paying.</h2>
          <div className="faq">
            {FAQ.map((f) => (
              <details key={f.q} data-reveal>
                <summary>{f.q}</summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <footer className="mk-foot">
        <div className="mk-wrap">
          <p className="big">Code2Img</p>
          <div className="cols">
            <nav aria-label="Product">
              <a href="/editor">Editor</a>
              <a href="/">Home</a>
              <a href="/dashboard">Dashboard</a>
            </nav>
            <nav aria-label="Developers">
              <a href="/docs">API reference</a>
              <a href="/mcp">MCP server</a>
              <a href="/api/v1/openapi.json">OpenAPI spec</a>
            </nav>
            <nav aria-label="Contact">
              <a href="mailto:hello@code2img.app">hello@code2img.app</a>
              <a href="mailto:support@code2img.app">support@code2img.app</a>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  );
}