"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";

const ERRORS: Record<string, string> = {
  INVALID_TOKEN: "This sign-in link has expired or was already used. Request a new one below.",
  USER_NOT_FOUND: "No account for this email — submitting the form below creates one.",
};

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // read once from the location: avoids useSearchParams' Suspense requirement
  useEffect(() => {
    const err = new URLSearchParams(window.location.search).get("error") ?? "";
    setError(ERRORS[err] ?? (err ? "Sign-in failed — try again below." : ""));
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    const { error } = await authClient.signIn.magicLink({ email, callbackURL: "/dashboard", errorCallbackURL: "/login" });
    setBusy(false);
    if (error) setError(error.message ?? "failed to send link");
    else setSent(true);
  };

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", fontFamily: "ui-sans-serif, system-ui" }}>
      <form onSubmit={submit} style={{ width: 320, display: "grid", gap: 12 }}>
        <h1 style={{ fontSize: 22, margin: 0 }}>Sign in to Code2Img</h1>
        <p style={{ margin: 0, color: "#666" }}>Magic link — no password.</p>
        <input
          type="email"
          required
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ padding: 10, borderRadius: 8, border: "1px solid #ccc" }}
        />
        <button type="submit" disabled={busy} style={{ padding: 10, borderRadius: 8, border: 0, background: "#111", color: "#fff", cursor: "pointer" }}>
          {busy ? "Sending…" : "Send magic link"}
        </button>
        {sent && <p style={{ color: "#0a7d32", margin: 0 }}>Link sent — check your inbox (dev: server logs).</p>}
        {error && <p style={{ color: "#c22", margin: 0 }}>{error}</p>}
        <Link href="/editor" style={{ color: "#666" }}>← Back to editor</Link>
      </form>
    </main>
  );
}
