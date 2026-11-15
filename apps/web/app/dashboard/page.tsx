"use client";

import { useCallback, useEffect, useState } from "react";
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
    const r = await fetch("/api/billing/checkout", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ plan }) });
    const j = await r.json();
    setBusy(false);
    if (j.url) location.href = j.url;
    else setNotice(j.error ?? "checkout failed");
  };

  const portal = async () => {
    setBusy(true);
    const r = await fetch("/api/billing/portal", { method: "POST" });
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
      <main className="dash">
        <div className="dash-card">
          <h2>Not signed in</h2>
          <p className="dash-note">The editor works without an account. An account keeps your presets, exports and API keys.</p>
          <a className="btn btn-primary" href="/login" style={{ justifySelf: "start" }}>
            Sign in
          </a>
        </div>
      </main>
    );
  }
  const plan = me?.entitlements?.plan ?? "…";

  return (
    <main className="dash">
      <header className="dash-head">
        <h1>Dashboard</h1>
        <div className="dash-who">
          <span>{me?.user?.email}</span>
          <span style={{ color: "var(--ink)" }}>{plan}</span>
          <button onClick={signOut} className="btn btn-sm">
            Sign out
          </button>
        </div>
      </header>

      <section className="dash-card">
        <h2>Billing</h2>
        {notice && <p className="dash-danger">{notice}</p>}
        {plan === "pro" ? (
          <div className="dash-row">
            <button onClick={portal} disabled={busy} className="btn">
              Manage subscription
            </button>
          </div>
        ) : (
          <div className="dash-row">
            <button onClick={() => checkout("pro-monthly")} disabled={busy} className="btn btn-primary">
              Go Pro — 7 €/mo
            </button>
            <button onClick={() => checkout("pro-yearly")} disabled={busy} className="btn">
              Go Pro — 59 €/yr
            </button>
          </div>
        )}
        <p className="dash-note">Pro: no watermark, custom logo and background, 4× and PDF HD, unlimited presets.</p>
      </section>

      <section className="dash-card">
        <h2>Presets ({presets.length})</h2>
        <ul>
          {presets.map((p) => (
            <li key={p.id}>
              <span>{p.name}</span>
              <button onClick={() => removePreset(p.id)} className="btn btn-sm dash-danger" aria-label={`Delete preset ${p.name}`}>
                Delete
              </button>
            </li>
          ))}
          {presets.length === 0 && <li className="dash-empty">No presets yet.</li>}
        </ul>
      </section>

      <section className="dash-card">
        <h2>Assets</h2>
        <ul>
          {assets.map((a) => (
            <li key={a.id}>
              <span>
                {a.kind}: {a.storageKey} ({Math.round(a.bytes / 1024)} KB)
              </span>
            </li>
          ))}
          {assets.length === 0 && <li className="dash-empty">No uploads (Pro feature).</li>}
        </ul>
      </section>

      <section className="dash-card">
        <h2>Recent renders</h2>
        <ul>
          {history.map((h) => (
            <li key={h.id}>
              <span>
                {h.format} · {h.configHash.slice(0, 10)} · {new Date(h.createdAt).toLocaleString()}
              </span>
            </li>
          ))}
          {history.length === 0 && <li className="dash-empty">No renders yet.</li>}
        </ul>
      </section>

      <section className="dash-card">
        <h2>API keys</h2>
        {newKey && (
          <p className="dash-key">
            Copy it now, it is shown only once: <code>{newKey}</code>
          </p>
        )}
        <div className="dash-row">
          <button onClick={() => createKey(["read", "write", "upload"])} className="btn btn-primary">
            Create API key
          </button>
          <a href="/docs" target="_blank" className="btn">
            API reference
          </a>
        </div>
        <ul>
          {keys.map((k) => (
            <li key={k.id}>
              <code>{k.prefix}…</code>
              <span>{k.scopes.join(", ")}</span>
              <span className="dash-note">
                {k.revokedAt ? "revoked" : k.lastUsedAt ? `last used ${new Date(k.lastUsedAt).toLocaleString()}` : "never used"}
              </span>
              {!k.revokedAt && (
                <>
                  <button onClick={() => rotateKey(k.id)} className="btn btn-sm">
                    Rotate
                  </button>
                  <button onClick={() => revokeKey(k.id)} className="btn btn-sm dash-danger">
                    Revoke
                  </button>
                </>
              )}
            </li>
          ))}
          {keys.length === 0 && <li className="dash-empty">No API keys yet.</li>}
        </ul>
      </section>

      <section className="dash-card">
        <h2>Account</h2>
        <div className="dash-row">
          <a href="/api/me/export" download className="btn">
            Export my data (JSON)
          </a>
          <button onClick={deleteAccount} className="btn dash-danger">
            Delete account
          </button>
        </div>
      </section>
    </main>
  );
}