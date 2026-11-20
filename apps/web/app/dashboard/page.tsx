"use client";

import "../nav.css";
import "./dashboard.css";
import "../app.css";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { createAuthClient } from "better-auth/react";

const authClient = createAuthClient();

interface Me {
  user: { id: string; email: string; name: string } | null;
  entitlements?: { plan: string };
}
interface Preset {
  id: string;
  name: string;
  config: Record<string, unknown>;
}
interface Upload {
  id: string;
  kind: string;
  storageKey: string;
  mime: string;
  bytes: number;
}
interface HistoryItem {
  id: string;
  format: string;
  configHash: string;
  createdAt: string;
}
interface ApiKey {
  id: string;
  prefix: string;
  scopes: string[];
  lastUsedAt: string | null;
  revokedAt: string | null;
  createdAt: string;
}

// Same markup as the landing header (site/shell.ts `nav`), minus the language switch:
// the dashboard is English-only. Styles come from app/nav.css, shared with the landing.
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
            <a
              key={l.href}
              className="mk-navlink"
              href={l.href}
              aria-current={l.href === "/dashboard" ? "page" : undefined}
            >
              {l.label}
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
}

function Card({ title, meta, wide, children }: { title: string; meta?: string; wide?: boolean; children: ReactNode }) {
  return (
    <section className={wide ? "dash-card dash-card--wide reveal" : "dash-card reveal"}>
      <div className="dash-card-head">
        <h2>{title}</h2>
        {meta && <span className="dash-meta">{meta}</span>}
      </div>
      {children}
    </section>
  );
}

export default function Dashboard() {
  const [me, setMe] = useState<Me | null>(null);
  const [presets, setPresets] = useState<Preset[]>([]);
  const [assets, setAssets] = useState<Upload[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [newKey, setNewKey] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  const loadAll = useCallback(async () => {
    const [me, presets, history, keys] = await Promise.all([
      fetch("/api/me").then((r) => r.json()),
      fetch("/api/presets").then((r) => (r.ok ? r.json() : { presets: [] })),
      fetch("/api/history").then((r) => (r.ok ? r.json() : { history: [] })),
      fetch("/api/me/keys").then((r) => (r.ok ? r.json() : { keys: [] })),
    ]);
    setMe(me);
    setPresets(presets.presets ?? []);
    setHistory(history.history ?? []);
    setKeys(keys.keys ?? []);
    if (me.entitlements?.plan === "pro") {
      // Assets endpoint: reuse presets list pattern — uploads listed via history of uploads table.
      const ups = await fetch("/api/me/assets").then((r) => (r.ok ? r.json() : { uploads: [] }));
      setAssets(ups.uploads ?? []);
    }
  }, []);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const checkout = async (plan: "pro-monthly" | "pro-yearly") => {
    setBusy(true);
    setNotice("");
    const r = await fetch("/api/billing/checkout", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ plan }) });
    if (!r.ok) {
      setBusy(false);
      const text = await r.text().catch(() => "");
      setNotice(text || `Checkout failed (${r.status})`);
      return;
    }
    const j = await r.json();
    setBusy(false);
    if (j.url) location.href = j.url;
    else setNotice(j.error ?? "checkout failed");
  };

  const portal = async () => {
    setBusy(true);
    setNotice("");
    const r = await fetch("/api/billing/portal", { method: "POST" });
    if (!r.ok) {
      setBusy(false);
      const text = await r.text().catch(() => "");
      setNotice(text || `Portal failed (${r.status})`);
      return;
    }
    const j = await r.json();
    setBusy(false);
    if (j.url) location.href = j.url;
    else setNotice(j.error ?? "portal failed");
  };

  const removePreset = async (id: string) => {
    await fetch(`/api/presets/${id}`, { method: "DELETE" });
    void loadAll();
  };

  const createKey = async (scopes: string[]) => {
    const r = await fetch("/api/me/keys", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ scopes }) });
    const j = await r.json();
    if (j.raw) setNewKey(j.raw);
    void loadAll();
  };

  const rotateKey = async (id: string) => {
    const r = await fetch(`/api/me/keys/${id}/rotate`, { method: "POST" });
    const j = await r.json();
    if (j.raw) setNewKey(j.raw);
    void loadAll();
  };

  const revokeKey = async (id: string) => {
    if (!confirm("Revoke this API key? Requests using it will start failing immediately.")) return;
    await fetch(`/api/me/keys/${id}`, { method: "DELETE" });
    void loadAll();
  };

  const deleteAccount = async () => {
    if (!confirm("Delete account and all data permanently?")) return;
    await fetch("/api/me/delete", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ confirm: "DELETE" }) });
    location.href = "/";
  };

  const signOut = async () => {
    await authClient.signOut();
    location.href = "/";
  };

  if (me?.user === null) {
    return (
      <>
        <SiteHeader />
        <main className="dash">
          <section className="dash-card dash-card--narrow reveal">
            <h2>Not signed in</h2>
            <p className="dash-note">The editor works without an account. An account keeps your presets, exports and API keys.</p>
            <div className="dash-row">
              <a className="btn btn-primary" href="/login">
                Sign in
              </a>
            </div>
          </section>
        </main>
      </>
    );
  }
  const plan = me?.entitlements?.plan ?? "…";
  const isPro = plan === "pro";

  return (
    <>
      <SiteHeader />
      <main className="dash">
        <header className="dash-top">
          <div className="dash-title">
            <p className="dash-kicker hero-in" style={{ "--hd": "0s" } as React.CSSProperties}>Account</p>
            <h1 className="hero-in" style={{ "--hd": ".15s" } as React.CSSProperties}>Dashboard</h1>
          </div>
          <div className="dash-who hero-in" style={{ "--hd": ".3s" } as React.CSSProperties}>
            <span className="dash-email">{me?.user?.email}</span>
            <span className={isPro ? "dash-plan dash-plan--pro" : "dash-plan"}>{plan}</span>
            <button onClick={signOut} className="btn btn-sm">
              Sign out
            </button>
          </div>
        </header>

        <div className="dash-grid" data-stagger>
          <Card title="Billing" meta={isPro ? "Pro" : "Free"}>
            {notice && <p className="dash-danger" role="alert">{notice}</p>}
            {isPro ? (
              <div className="dash-row">
                <button onClick={portal} disabled={busy} className="btn">
                  Manage subscription
                </button>
              </div>
            ) : (
              <div className="dash-row">
                <button onClick={() => checkout("pro-monthly")} disabled={busy} className="btn btn-primary">
                  Go Pro — 3 €/mo
                </button>
                <button onClick={() => checkout("pro-yearly")} disabled={busy} className="btn">
                  Go Pro — 29 €/yr
                </button>
              </div>
            )}
            <p className="dash-note">Pro: no watermark, custom logo and background, 4× and PDF HD, unlimited presets.</p>
          </Card>

          <Card title="Presets" meta={`${presets.length}`}>
            <ul className="dash-list">
              {presets.map((p) => (
                <li key={p.id}>
                  <span className="dash-item">{p.name}</span>
                  <div className="dash-actions">
                    <button onClick={() => removePreset(p.id)} className="btn btn-sm dash-danger" aria-label={`Delete preset ${p.name}`}>
                      Delete
                    </button>
                  </div>
                </li>
              ))}
              {presets.length === 0 && <li className="dash-empty">No presets yet.</li>}
            </ul>
          </Card>

          <Card title="API keys" meta={`${keys.filter((k) => !k.revokedAt).length} active`} wide>
            {newKey && (
              <p className="dash-key" role="status">
                Copy it now, it is shown only once: <code>{newKey}</code>
              </p>
            )}
            <div className="dash-row">
              <button onClick={() => createKey(["read", "write", "upload"])} className="btn btn-primary">
                Create API key
              </button>
              <a href="/docs" target="_blank" rel="noopener" className="btn">
                API reference
              </a>
            </div>
            <ul className="dash-list">
              {keys.map((k) => (
                <li key={k.id}>
                  <span className="dash-item">
                    <code className="dash-mono">{k.prefix}…</code>
                    <span className="dash-meta">{k.scopes.join(", ")}</span>
                  </span>
                  <span className="dash-meta">
                    {k.revokedAt ? "revoked" : k.lastUsedAt ? `last used ${new Date(k.lastUsedAt).toLocaleString()}` : "never used"}
                  </span>
                  {!k.revokedAt && (
                    <div className="dash-actions">
                      <button onClick={() => rotateKey(k.id)} className="btn btn-sm">
                        Rotate
                      </button>
                      <button onClick={() => revokeKey(k.id)} className="btn btn-sm dash-danger">
                        Revoke
                      </button>
                    </div>
                  )}
                </li>
              ))}
              {keys.length === 0 && <li className="dash-empty">No API keys yet.</li>}
            </ul>
          </Card>

          <Card title="Assets" meta={isPro ? `${assets.length}` : "Pro"}>
            <ul className="dash-list">
              {assets.map((a) => (
                <li key={a.id}>
                  <span className="dash-item">
                    {a.kind}: {a.storageKey}
                  </span>
                  <span className="dash-meta">{Math.round(a.bytes / 1024)} KB</span>
                </li>
              ))}
              {assets.length === 0 && <li className="dash-empty">{isPro ? "No uploads yet." : "Uploads are a Pro feature."}</li>}
            </ul>
          </Card>

          <Card title="Recent renders" meta={`${history.length}`}>
            <ul className="dash-list">
              {history.map((h) => (
                <li key={h.id}>
                  <span className="dash-item">
                    <span className="dash-mono">{h.format}</span>
                    <code className="dash-mono dash-meta">{h.configHash.slice(0, 10)}</code>
                  </span>
                  <span className="dash-meta">{new Date(h.createdAt).toLocaleString()}</span>
                </li>
              ))}
              {history.length === 0 && <li className="dash-empty">No renders yet.</li>}
            </ul>
          </Card>

          <Card title="Account" wide>
            <ul className="dash-list">
              <li>
                <span className="dash-item">
                  <span>Export my data</span>
                  <span className="dash-meta">Presets, renders and key metadata as JSON.</span>
                </span>
                <div className="dash-actions">
                  <a href="/api/me/export" download className="btn btn-sm">
                    Download JSON
                  </a>
                </div>
              </li>
              <li>
                <span className="dash-item">
                  <span>Delete account</span>
                  <span className="dash-meta">Removes the account and all data. This cannot be undone.</span>
                </span>
                <div className="dash-actions">
                  <button onClick={deleteAccount} className="btn btn-sm dash-danger">
                    Delete account
                  </button>
                </div>
              </li>
            </ul>
          </Card>
        </div>
      </main>
    </>
  );
}
