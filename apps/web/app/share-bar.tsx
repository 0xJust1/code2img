"use client";

// Share bar for the public page. Every network gets the UTM-tagged URL built on the
// server (`urls`), so tracking never differs between client and metadata.
import { useEffect, useState } from "react";
import { SHARE_NETWORKS, SHARE_TEXT } from "@/lib/share-networks";

const enc = encodeURIComponent;

const MASTODON_KEY = "c2i:mastodon";

export default function ShareBar({ urls }: { urls: Record<string, string> }) {
  const [instance, setInstance] = useState("mastodon.social");
  const [status, setStatus] = useState("");
  const [canNativeShare, setCanNativeShare] = useState(false);

  useEffect(() => {
    setInstance(localStorage.getItem(MASTODON_KEY) || "mastodon.social");
    setCanNativeShare(typeof navigator.share === "function");
  }, []);

  const mastodonHref = (() => {
    const host = instance.trim().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
    const url = urls.mastodon ?? "";
    return `https://${host}/share?text=${enc(`${SHARE_TEXT} ${url}`)}`;
  })();

  const remember = (value: string) => {
    setInstance(value);
    localStorage.setItem(MASTODON_KEY, value);
  };

  const copy = async () => {
    await navigator.clipboard.writeText(urls.copy ?? "");
    setStatus("Link copied");
  };

  const nativeShare = async () => {
    try {
      await navigator.share({ title: SHARE_TEXT, url: urls.copy });
    } catch {
      // user dismissed the sheet: nothing to report
    }
  };

  return (
    <section className="share-bar" aria-label="Share this image">
      {SHARE_NETWORKS.map((n) => (
        <a key={n.id} className="ghost" href={n.href(urls[n.id] ?? "", SHARE_TEXT)} target="_blank" rel="noreferrer noopener">
          {n.label}
        </a>
      ))}
      <span className="mastodon">
        <a className="ghost" href={mastodonHref} target="_blank" rel="noreferrer noopener">
          Mastodon
        </a>
        <input
          type="text"
          aria-label="Mastodon instance"
          value={instance}
          onChange={(e) => remember(e.target.value)}
          placeholder="mastodon.social"
          size={18}
        />
      </span>
      {canNativeShare && (
        <button className="ghost" onClick={() => void nativeShare()}>
          Share…
        </button>
      )}
      <button className="ghost" onClick={() => void copy()}>
        Copy link
      </button>
      <span className="status" aria-live="polite">
        {status}
      </span>
    </section>
  );
}

/** Owner-only: kill the link (and its bytes) from the page itself. */
export function OwnerDelete({ slug }: { slug: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const remove = async () => {
    if (!window.confirm("Delete this public link? The image stops being reachable.")) return;
    setBusy(true);
    const res = await fetch(`/api/share/${slug}`, { method: "DELETE" });
    if (res.ok) {
      window.location.assign("/");
      return;
    }
    setError((await res.json().catch(() => ({}))).error ?? "delete failed");
    setBusy(false);
  };

  return (
    <>
      <button className="ghost" onClick={() => void remove()} disabled={busy}>
        {busy ? "Deleting…" : "Delete link"}
      </button>
      {error && <span className="error">{error}</span>}
    </>
  );
}