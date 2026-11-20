"use client";

import "../nav.css";
import "./login.css";
import "../app.css";
import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";

const ERRORS: Record<string, string> = {
  INVALID_TOKEN: "This sign-in link has expired or was already used. Request a new one below.",
  USER_NOT_FOUND: "No account for this email yet. Continue below and one is created for you.",
};

// Same header as the landing and the dashboard (site/shell.ts `nav`), English only.
const NAV_LINKS = [
  { href: "/editor", label: "Editor" },
  { href: "/pricing", label: "Pricing" },
  { href: "/docs", label: "Docs" },
  { href: "/blog", label: "Blog" },
  { href: "/dashboard", label: "Dashboard" },
];

function SiteHeader() {
  return (
    <header className="mk-nav">
      <div className="mk-wrap">
        <a href="/" className="wordmark" aria-label="code2img — code to image">
          <svg width="22" height="22" viewBox="0 0 32 32" aria-hidden="true" focusable="false">
            <g fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.6 8.6 4 16l6.6 7.4" />
              <path d="M21.4 8.6 28 16l-6.6 7.4" />
            </g>
            <rect x="12.9" y="12.9" width="6.2" height="6.2" rx="1.6" fill="var(--accent)" />
          </svg>
          <span>
            Code<span className="wordmark-two">2</span>Img
          </span>
        </a>
        <nav className="mk-links" aria-label="Main">
          {NAV_LINKS.map((l) => (
            <a key={l.href} className="mk-navlink" href={l.href}>
              {l.label}
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // read once from the location: avoids useSearchParams' Suspense requirement
  useEffect(() => {
    const err = new URLSearchParams(window.location.search).get("error") ?? "";
    setError(ERRORS[err] ?? (err ? "Sign-in failed. Try again below." : ""));
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    const { error } = await authClient.signIn.magicLink({ email, callbackURL: "/dashboard", errorCallbackURL: "/login" });
    setBusy(false);
    if (error) setError(error.message ?? "We could not send the link. Try again.");
    else setSent(true);
  };

  const reset = () => {
    setSent(false);
    setError("");
  };

  return (
    <>
      <SiteHeader />
      <main className="login">
        <div className="mk-wrap login-wrap">
          <section className="login-card hero-in" style={{ "--hd": ".15s" } as React.CSSProperties} aria-labelledby="login-title">
            <p className="login-kicker">Account</p>
            <h1 id="login-title">Sign in to code2img</h1>

            {sent ? (
              <div className="login-sent" role="status">
                <h2>Check your inbox</h2>
                <p>
                  We sent a sign-in link to <strong>{email}</strong>. The link expires in 5 minutes and works once.
                </p>
                {process.env.NODE_ENV !== "production" && (
                  <p className="login-dev">dev: the link is printed in the server logs.</p>
                )}
                <button type="button" className="btn" onClick={reset}>
                  Use a different email
                </button>
              </div>
            ) : (
              <>
                <p className="login-lead">
                  Sign in to reach your Pro exports and dashboard. No password: we email you a link.
                </p>
                <form onSubmit={submit} className="login-form">
                  <div className="login-field">
                    <label htmlFor="login-email">Email</label>
                    <input
                      id="login-email"
                      type="email"
                      name="email"
                      autoComplete="email"
                      required
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <button type="submit" className="btn btn-primary btn-submit" disabled={busy}>
                    {busy ? "Sending link…" : "Continue with email"}
                  </button>
                  <p className="login-hint">We will send a sign-in link to this address. Nothing to remember.</p>
                </form>
              </>
            )}

            {error && (
              <p className="login-error" role="alert">
                {error}
              </p>
            )}

            <a href="/editor" className="login-back">
              ← Back to editor
            </a>
          </section>
          <p className="login-legal login-legal-out hero-in" style={{ "--hd": ".3s" } as React.CSSProperties}>
            By signing in you agree to our <a href="/legal/terms">Terms</a> and <a href="/legal/privacy">Privacy policy</a>.
          </p>
        </div>
      </main>
    </>
  );
}
