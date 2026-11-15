"use client";

// The live thing: type a snippet, pick a theme, and the product renders it — same pipeline as the editor.
import { useRef, useState } from "react";

const SAMPLE = `// greet.ts
export function greet(name: string): string {
  return \`Hello, \${name}!\`;
}`;

const THEMES = ["github-dark", "tokyo-night", "catppuccin-latte", "rose-pine", "nord", "min-light"];
const LANGS = ["auto", "typescript", "python", "go", "rust", "sql", "bash"];

export default function LandingDemo() {
  const [code, setCode] = useState(SAMPLE);
  const [theme, setTheme] = useState(THEMES[0]);
  const [language, setLanguage] = useState("auto");
  const [src, setSrc] = useState("/examples/hero.jpg");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const url = useRef<string | null>(null);

  async function render() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/render", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          config: { code, language, theme, title: "snippet", background: { type: "gradient", preset: "midnight" } },
          format: "png",
          scale: 2,
        }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        setError(j.error ?? `render failed (${res.status})`);
        return;
      }
      const blob = await res.blob();
      if (url.current) URL.revokeObjectURL(url.current);
      url.current = URL.createObjectURL(blob);
      setSrc(url.current);
    } catch {
      setError("render failed — try again");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="demo-grid">
      <div className="demo-controls">
        <label>
          Code
          <textarea
            aria-label="Code"
            value={code}
            spellCheck={false}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Tab") {
                e.preventDefault();
                const t = e.currentTarget;
                const s = t.selectionStart;
                setCode(`${code.slice(0, s)}  ${code.slice(t.selectionEnd)}`);
              }
            }}
          />
        </label>
        <label>
          Theme
          <select aria-label="Theme" value={theme} onChange={(e) => setTheme(e.target.value)}>
            {THEMES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <label>
          Language
          <select aria-label="Language" value={language} onChange={(e) => setLanguage(e.target.value)}>
            {LANGS.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </label>
        <button className="btn btn-primary" type="button" onClick={render} disabled={busy}>
          {busy ? "Rendering…" : "Render image"}
        </button>
        {error ? <p className="error">{error}</p> : null}
      </div>
      <div>
        <div className="demo-out">
          <img src={src} alt="The rendered code card from the snippet above" width={640} height={360} />
        </div>
        <p className="demo-note">Real output from the render service, at 2× — same result as the editor export.</p>
      </div>
    </div>
  );
}