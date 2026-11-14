"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  cardConfigSchema,
  decodePreset,
  encodePreset,
  buildCardHtml,
  defaultConfig,
  gradientPresets,
  patterns,
  FONTS,
  LANGUAGES,
  THEMES,
  type CardConfig,
  type Ratio,
} from "@code2img/shared";

const SAMPLE_CODE = `// Try it — edit me
function greet(name: string): string {
  return \`Hello, \${name}!\`;
}

for (const who of ["world", "Code2Img"]) {
  console.log(greet(who));
}`;

function initialConfig(): CardConfig {
  const base = { ...defaultConfig, code: SAMPLE_CODE, title: "index.ts", language: "auto" };
  if (typeof window !== "undefined" && window.location.hash.length > 1) {
    const fromHash = decodePreset(window.location.hash.slice(1));
    if (fromHash) return fromHash;
  }
  return base;
}

export default function Editor() {
  const [cfg, setCfg] = useState<CardConfig>(initialConfig);
  const [html, setHtml] = useState("");
  const [mounted, setMounted] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [format, setFormat] = useState<"png" | "jpg" | "pdf">("png");
  const [scale, setScale] = useState(2);
  const [quality, setQuality] = useState(90);
  const [widthMode, setWidthMode] = useState<"auto" | "fixed">(cfg.width ? "fixed" : "auto");
  const [plan, setPlan] = useState<string>("free");
  const [assets, setAssets] = useState<{ file: string; kind: string }[]>([]);
  const [previewAssets, setPreviewAssets] = useState<Record<string, string>>({}); // file -> data URL
  const codeRef = useRef<HTMLTextAreaElement>(null);
  const cfgRef = useRef(cfg);
  cfgRef.current = cfg;

  useEffect(() => setMounted(true), []);

  // Session + Pro assets (owner-only endpoints; anonymous users stay free-tier).
  useEffect(() => {
    void (async () => {
      const me = await fetch("/api/me").then((r) => r.json()).catch(() => null);
      const p = me?.entitlements?.plan ?? "free";
      setPlan(p);
      if (p !== "pro") return;
      const ups = await fetch("/api/me/assets").then((r) => (r.ok ? r.json() : { uploads: [] })).catch(() => ({ uploads: [] }));
      const list = (ups.uploads ?? []) as { storageKey: string; kind: string }[];
      setAssets(list.map((u) => ({ file: u.storageKey, kind: u.kind })));
      const map: Record<string, string> = {};
      await Promise.all(
        list.map(async (u) => {
          const blob = await fetch(`/api/uploads/${u.storageKey}`).then((r) => (r.ok ? r.blob() : null)).catch(() => null);
          if (blob) map[u.storageKey] = await new Promise<string>((res) => {
            const fr = new FileReader();
            fr.onload = () => res(fr.result as string);
            fr.readAsDataURL(blob); // data URL: survives the sandboxed srcDoc iframe
          });
        }),
      );
      setPreviewAssets(map);
    })();
  }, []);

  // Live preview: same buildCardHtml as the server pipeline -> WYSIWYG by construction.
  useEffect(() => {
    let alive = true;
    const t = setTimeout(() => {
      buildCardHtml(cfg, { fontBaseUrl: "/api/fonts", attachments: previewAssets })
        .then((h) => alive && setHtml(h))
        .catch((e) => alive && setError(String(e)));
    }, 150);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [cfg, previewAssets]);

  // Preset serialization in the URL hash (shareable link).
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        history.replaceState(null, "", `#${encodePreset(cfg)}`);
      } catch {
        /* code too large for a URL — keep last hash */
      }
    }, 400);
    return () => clearTimeout(t);
  }, [cfg]);

  const patch = useCallback((p: Partial<CardConfig>) => setCfg((c) => ({ ...c, ...p })), []);

  const doExport = useCallback(
    async (fmt: "png" | "jpg" | "pdf" = format) => {
      const current = cfgRef.current;
      const check = cardConfigSchema.safeParse(current);
      if (!check.success) {
        setError(check.error.issues[0]?.message ?? "invalid config");
        return;
      }
      setBusy(true);
      setError("");
      setStatus("Rendering…");
      try {
        const res = await fetch("/api/render", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            config: current,
            format: fmt,
            scale: fmt === "png" || fmt === "jpg" ? scale : 1,
            quality,
          }),
        });
        if (!res.ok) throw new Error(`${res.status} ${(await res.json().catch(() => ({}))).error ?? ""}`);
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `code2img-${Date.now().toString(36)}.${fmt === "jpg" ? "jpg" : fmt}`;
        a.click();
        URL.revokeObjectURL(url);
        setStatus(`Exported ${fmt.toUpperCase()} (${Math.round(blob.size / 1024)} KB)`);
      } catch (e) {
        setError((e as Error).message);
        setStatus("");
      } finally {
        setBusy(false);
      }
    },
    [format, scale, quality],
  );

  const uploadAsset = useCallback(async (f: File) => {
    const fd = new FormData();
    fd.append("file", f);
    // kind inferred: images used as logo must be small/flat; default to background.
    fd.append("kind", f.type === "image/png" && f.size < 300_000 ? "logo" : "background");
    setStatus("Uploading…");
    const r = await fetch("/api/uploads", { method: "POST", body: fd });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) {
      setError(j.error ?? "upload failed");
      setStatus("");
      return;
    }
    setAssets((a) => [...a, { file: j.file, kind: j.kind }]);
    const dataUrl = await new Promise<string>((res) => {
      const fr = new FileReader();
      fr.onload = () => res(fr.result as string);
      fr.readAsDataURL(f);
    });
    setPreviewAssets((m) => ({ ...m, [j.file]: dataUrl }));
    setStatus(`Uploaded ${j.file}`);
  }, []);

  const copyLink = useCallback(async () => {
    await navigator.clipboard.writeText(location.href);
    setStatus("Link copied");
  }, []);

  // Keyboard shortcuts: Ctrl/⌘+E export PNG, Ctrl/⌘+K copy link.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey)) return;
      const k = e.key.toLowerCase();
      if (k === "e") {
        e.preventDefault();
        void doExport("png");
      } else if (k === "k") {
        e.preventDefault();
        void copyLink();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [doExport, copyLink]);

  const onCodeKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const ta = codeRef.current!;
      const { selectionStart: s, selectionEnd: en, value } = ta;
      ta.value = value.slice(0, s) + "  " + value.slice(en);
      ta.selectionStart = ta.selectionEnd = s + 2;
      patch({ code: ta.value });
    }
  };

  const bg = cfg.background;

  return (
    <div className="layout">
      <aside className="controls">
        <div className="group">
          <h2>Code</h2>
          <div className="fields">
            <label className="full">
              Code
              <textarea
                ref={codeRef}
                aria-label="Code editor"
                value={cfg.code}
                onChange={(e) => patch({ code: e.target.value })}
                onKeyDown={onCodeKey}
                spellCheck={false}
              />
            </label>
            <label>
              Language
              <select value={cfg.language} onChange={(e) => patch({ language: e.target.value })} aria-label="Language">
                {LANGUAGES.map((l) => (
                  <option key={l} value={l}>
                    {l === "auto" ? "Auto-detect" : l}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Theme
              <select value={cfg.theme} onChange={(e) => patch({ theme: e.target.value })} aria-label="Color theme">
                {THEMES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Font
              <select value={cfg.font} onChange={(e) => patch({ font: e.target.value })} aria-label="Font">
                {FONTS.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="check">
              <input type="checkbox" checked={cfg.ligatures} onChange={(e) => patch({ ligatures: e.target.checked })} />
              <span>Ligatures</span>
            </label>
          </div>
        </div>

        <div className="group">
          <h2>Card</h2>
          <div className="fields">
            <label className="full">
              Title / filename
              <input type="text" value={cfg.title} onChange={(e) => patch({ title: e.target.value })} placeholder="index.ts" />
            </label>
            <label>
              Window style
              <select value={cfg.windowStyle} onChange={(e) => patch({ windowStyle: e.target.value as CardConfig["windowStyle"] })} aria-label="Window style">
                <option value="mac">macOS</option>
                <option value="windows">Windows</option>
                <option value="minimal">Minimal</option>
                <option value="none">None</option>
              </select>
            </label>
            <label>
              Ratio
              <select value={cfg.ratio} onChange={(e) => patch({ ratio: e.target.value as Ratio })} aria-label="Aspect ratio">
                <option value="auto">Auto</option>
                <option value="1:1">1:1</option>
                <option value="16:9">16:9</option>
                <option value="4:5">4:5</option>
                <option value="og">OG 1200×630</option>
              </select>
            </label>
            <label>
              Font size ({cfg.fontSize}px)
              <input type="range" min={10} max={24} value={cfg.fontSize} onChange={(e) => patch({ fontSize: +e.target.value })} />
            </label>
            <label>
              Line height ({cfg.lineHeight})
              <input type="range" min={1.2} max={2.2} step={0.1} value={cfg.lineHeight} onChange={(e) => patch({ lineHeight: +e.target.value })} />
            </label>
            <label>
              Padding ({cfg.padding}px)
              <input type="range" min={0} max={128} value={cfg.padding} onChange={(e) => patch({ padding: +e.target.value })} />
            </label>
            <label>
              Radius ({cfg.radius}px)
              <input type="range" min={0} max={32} value={cfg.radius} onChange={(e) => patch({ radius: +e.target.value })} />
            </label>
            <label className="check">
              <input type="checkbox" checked={cfg.shadow} onChange={(e) => patch({ shadow: e.target.checked })} />
              <span>Shadow</span>
            </label>
            <label className="check">
              <input type="checkbox" checked={cfg.lineNumbers} onChange={(e) => patch({ lineNumbers: e.target.checked })} />
              <span>Line numbers</span>
            </label>
            <label className="full">
              Highlighted lines (comma-separated)
              <input
                type="text"
                value={cfg.highlightLines.join(",")}
                onChange={(e) =>
                  patch({ highlightLines: e.target.value.split(",").map((s) => parseInt(s.trim(), 10)).filter((n) => Number.isFinite(n) && n > 0) })
                }
                placeholder="2,4-…"
              />
            </label>
            <label>
              Width
              <select value={widthMode} onChange={(e) => { const m = e.target.value as "auto" | "fixed"; setWidthMode(m); patch({ width: m === "fixed" ? 640 : null }); }}>
                <option value="auto">Auto</option>
                <option value="fixed">Fixed</option>
              </select>
            </label>
            {widthMode === "fixed" && (
              <label>
                Width (px)
                <input type="number" min={240} max={2000} value={cfg.width ?? 640} onChange={(e) => patch({ width: Math.min(2000, Math.max(240, +e.target.value || 240)) })} />
              </label>
            )}
          </div>
        </div>

        <div className="group">
          <h2>Background</h2>
          <div className="fields">
            <label className="full">
              Type
              <select value={bg.type} onChange={(e) => {
                const t = e.target.value as typeof bg.type;
                setCfg((c) => ({
                  ...c,
                  background:
                    t === "gradient" ? { type: "gradient", preset: gradientPresets[0]!.id }
                    : t === "solid" ? { type: "solid", color: "#0f2027" }
                    : t === "mesh" ? { type: "mesh", colors: ["#ff9966", "#654ea3", "#1bffff"] }
                    : t === "pattern" ? { type: "pattern", pattern: "dots", color: "#3a3a52", base: "#1e1e2e" }
                    : t === "image" ? { type: "image", file: assets.find((a) => a.kind === "background")?.file ?? "" }
                    : { type: "transparent" },
                }));
              }} aria-label="Background type">
                <option value="gradient">Gradient</option>
                <option value="solid">Solid</option>
                <option value="mesh">Mesh</option>
                <option value="pattern">Pattern</option>
                {plan === "pro" && <option value="image">Custom image (Pro)</option>}
                <option value="transparent">Transparent</option>
              </select>
            </label>
            {bg.type === "image" && (
              <label className="full">
                Uploaded background
                <select value={bg.file} onChange={(e) => setCfg((c) => ({ ...c, background: { type: "image", file: e.target.value } }))}>
                  {assets.filter((a) => a.kind === "background").map((a) => (
                    <option key={a.file} value={a.file}>{a.file}</option>
                  ))}
                </select>
              </label>
            )}
            {bg.type === "gradient" && (
              <label className="full">
                Preset
                <select value={bg.preset} onChange={(e) => setCfg((c) => ({ ...c, background: { type: "gradient", preset: e.target.value } }))} aria-label="Gradient preset">
                  {gradientPresets.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
            {bg.type === "solid" && (
              <label className="full">
                Color
                <input type="color" value={bg.color} onChange={(e) => setCfg((c) => ({ ...c, background: { type: "solid", color: e.target.value } }))} />
              </label>
            )}
            {bg.type === "mesh" && (
              <>
                {[0, 1, 2].map((i) => (
                  <label key={i}>
                    Color {i + 1}
                    <input
                      type="color"
                      value={bg.colors[i] ?? "#888888"}
                      onChange={(e) =>
                        setCfg((c) => {
                          const colors = [...(c.background.type === "mesh" ? c.background.colors : [])];
                          colors[i] = e.target.value;
                          return { ...c, background: { type: "mesh", colors } };
                        })
                      }
                    />
                  </label>
                ))}
              </>
            )}
            {bg.type === "pattern" && (
              <>
                <label>
                  Pattern
                  <select value={bg.pattern} onChange={(e) => setCfg((c) => ({ ...c, background: { ...(c.background as Extract<CardConfig["background"], { type: "pattern" }>), pattern: e.target.value as (typeof patterns)[number] } }))}>
                    {patterns.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Base
                  <input type="color" value={bg.base} onChange={(e) => setCfg((c) => ({ ...c, background: { ...(c.background as Extract<CardConfig["background"], { type: "pattern" }>), base: e.target.value } }))} />
                </label>
                <label className="full">
                  Pattern color
                  <input type="color" value={bg.color} onChange={(e) => setCfg((c) => ({ ...c, background: { ...(c.background as Extract<CardConfig["background"], { type: "pattern" }>), color: e.target.value } }))} />
                </label>
              </>
            )}
          </div>
        </div>

        <div className="group">
          <h2>Branding</h2>
          <div className="fields">
            <label className="full">
              Author name
              <input type="text" value={cfg.author.name} onChange={(e) => patch({ author: { ...cfg.author, name: e.target.value } })} placeholder="@you" />
            </label>
            <label className="full">
              Author link
              <input type="url" value={cfg.author.link} onChange={(e) => patch({ author: { ...cfg.author, link: e.target.value } })} placeholder="https://…" />
            </label>
            {plan === "pro" ? (
              <>
                <label className="check">
                  <input type="checkbox" checked={cfg.watermark} onChange={(e) => patch({ watermark: e.target.checked })} />
                  <span>Watermark (Pro can disable)</span>
                </label>
                <label className="full">
                  Logo (Pro)
                  <select
                    value={cfg.logo ?? ""}
                    onChange={(e) => patch({ logo: e.target.value || undefined })}
                  >
                    <option value="">None</option>
                    {assets.filter((a) => a.kind === "logo").map((a) => (
                      <option key={a.file} value={a.file}>{a.file}</option>
                    ))}
                  </select>
                </label>
                <label className="full">
                  Upload asset (2 MB max, png/jpeg/webp)
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) void uploadAsset(f);
                    }}
                  />
                </label>
              </>
            ) : (
              <label className="full" style={{ color: "#888" }}>
                Watermark / logo / custom background are Pro — <a href="/dashboard">upgrade</a>
              </label>
            )}
          </div>
        </div>
      </aside>

      <section className="stage">
        <div className="preview">
          {mounted && <iframe title="Card preview" srcDoc={html} sandbox="allow-same-origin" />}
        </div>
        <div className="actions">
          <label style={{ maxWidth: 120 }}>
            Format
            <select value={format} onChange={(e) => setFormat(e.target.value as typeof format)} aria-label="Export format">
              <option value="png">PNG</option>
              <option value="jpg">JPG</option>
              <option value="pdf">PDF</option>
            </select>
          </label>
          {format !== "pdf" && (
            <label style={{ maxWidth: 90 }}>
              Scale
              <select value={scale} onChange={(e) => setScale(+e.target.value)} aria-label="Export scale" disabled={format === "jpg" && scale > 4}>
                {(plan === "pro" ? [1, 2, 3, 4] : [1, 2]).map((s) => (
                  <option key={s} value={s}>
                    {s}x
                  </option>
                ))}
              </select>
            </label>
          )}
          {format === "jpg" && (
            <label style={{ maxWidth: 110 }}>
              Quality ({quality})
              <input type="range" min={40} max={100} value={quality} onChange={(e) => setQuality(+e.target.value)} />
            </label>
          )}
          <button className="primary" onClick={() => void doExport()} disabled={busy}>
            {busy ? "Rendering…" : "Export"}
          </button>
          <button className="ghost" onClick={() => void copyLink()}>
            Copy link
          </button>
          <a href={plan === "free" ? "/login" : "/dashboard"} style={{ alignSelf: "center", fontSize: 13 }}>
            {plan === "free" ? "Sign in" : "Dashboard"}
          </a>
          <span className="status" aria-live="polite">{status}</span>
          {error && <span className="error" role="alert">{error}</span>}
        </div>
      </section>
    </div>
  );
}
