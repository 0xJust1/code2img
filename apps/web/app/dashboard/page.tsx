"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
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

const btn = { padding: "8px 12px", borderRadius: 8, border: "1px solid #ccc", background: "#fff", cursor: "pointer" } as const;

export default function Dashboard() {
  const [me, setMe] = useState<Me | null>(null);
  const [presets, setPresets] = useState<Preset[]>([]);
  const [assets, setAssets] = useState<Upload[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  const loadAll = useCallback(async () => {
    const [me, presets, history] = await Promise.all([
      fetch("/api/me").then((r) => r.json()),
      fetch("/api/presets").then((r) => (r.ok ? r.json() : { presets: [] })),
      fetch("/api/history").then((r) => (r.ok ? r.json() : { history: [] })),
    ]);
    setMe(me);
    setPresets(presets.presets ?? []);
    setHistory(history.history ?? []);
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
      <main style={{ padding: 40, fontFamily: "ui-sans-serif, system-ui" }}>
        <p>Not signed in.</p>
        <Link href="/login">Sign in</Link>
      </main>
    );
  }
  const plan = me?.entitlements?.plan ?? "…";

  return (
    <main style={{ maxWidth: 760, margin: "0 auto", padding: 32, fontFamily: "ui-sans-serif, system-ui", display: "grid", gap: 28 }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ fontSize: 22, margin: 0 }}>Dashboard</h1>
        <span>
          {me?.user?.email} · <strong>{plan}</strong> <button onClick={signOut} style={btn}>Sign out</button>
        </span>
      </header>

      <section>
        <h2 style={{ fontSize: 16 }}>Billing</h2>
        {notice && <p style={{ color: "#c22" }}>{notice}</p>}
        {plan === "pro" ? (
          <button onClick={portal} disabled={busy} style={btn}>Manage subscription (Stripe Portal)</button>
        ) : (
          <p style={{ display: "flex", gap: 12 }}>
            <button onClick={() => checkout("pro-monthly")} disabled={busy} style={btn}>Go Pro — 7 €/mo</button>
            <button onClick={() => checkout("pro-yearly")} disabled={busy} style={btn}>Go Pro — 59 €/yr</button>
          </p>
        )}
        <p style={{ color: "#666" }}>Pro: no watermark, custom logo & background, 4x/PDF HD, unlimited presets.</p>
      </section>

      <section>
        <h2 style={{ fontSize: 16 }}>Presets ({presets.length})</h2>
        <ul style={{ paddingLeft: 18 }}>
          {presets.map((p) => (
            <li key={p.id}>
              {p.name} <button onClick={() => removePreset(p.id)} style={{ ...btn, border: 0, color: "#c22", cursor: "pointer" }}>×</button>
            </li>
          ))}
          {presets.length === 0 && <li style={{ color: "#888", listStyle: "none" }}>No presets yet.</li>}
        </ul>
      </section>

      <section>
        <h2 style={{ fontSize: 16 }}>Assets</h2>
        <ul style={{ paddingLeft: 18 }}>
          {assets.map((a) => (
            <li key={a.id}>
              {a.kind}: {a.storageKey} ({Math.round(a.bytes / 1024)} KB)
            </li>
          ))}
          {assets.length === 0 && <li style={{ color: "#888", listStyle: "none" }}>No uploads (Pro feature).</li>}
        </ul>
      </section>

      <section>
        <h2 style={{ fontSize: 16 }}>Recent renders</h2>
        <ul style={{ paddingLeft: 18 }}>
          {history.map((h) => (
            <li key={h.id}>
              {h.format} · {h.configHash.slice(0, 10)} · {new Date(h.createdAt).toLocaleString()}
            </li>
          ))}
          {history.length === 0 && <li style={{ color: "#888", listStyle: "none" }}>No renders yet.</li>}
        </ul>
      </section>

      <section>
        <h2 style={{ fontSize: 16 }}>Account</h2>
        <p style={{ display: "flex", gap: 12 }}>
          <a href="/api/me/export" download style={btn}>Export my data (JSON)</a>
          <button onClick={deleteAccount} style={{ ...btn, color: "#c22" }}>Delete account</button>
        </p>
      </section>
    </main>
  );
}
