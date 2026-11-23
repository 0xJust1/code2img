import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import nextConfig from "../next.config";
import sitemap from "../app/sitemap";
import { comparisonPage, languagePage, VS } from "../app/site/pages";
import { footer } from "../app/site/shell";

process.env.APP_URL = "https://code2img.app";
const ROOT = path.resolve(import.meta.dirname, "..");
const REPO = path.resolve(ROOT, "../..");

describe("SEO-001 canonical host", () => {
  const redirects = async () => (await nextConfig.redirects!()) ?? [];

  it("permanently redirects every www URL to the apex, path preserved", async () => {
    const rules = (await redirects()).filter((r) =>
      (r.has ?? []).some((h) => h.type === "host" && h.value === "www.code2img.app"),
    );
    expect(rules).toHaveLength(1);
    const rule = rules[0]!;
    expect(rule.permanent).toBe(true); // permanent:true answers 308, a 301-class status
    expect(rule.destination).toBe("https://code2img.app/:path*");
    expect(rule.source).toBe("/:path*");
  });

  it("does not redirect the apex, so no loop is possible", async () => {
    for (const rule of await redirects()) {
      for (const h of rule.has ?? []) expect(h.value).not.toBe("code2img.app");
      expect(rule.destination).not.toMatch(/www\./);
    }
  });
});

describe("SEO-003 sitemap x-default", () => {
  const entries = sitemap();

  it("declares en, fr and x-default on every bilingual entry", () => {
    const bilingual = entries.filter((e) => e.alternates?.languages);
    expect(bilingual.length).toBeGreaterThanOrEqual(8);
    for (const entry of bilingual) {
      const langs = entry.alternates!.languages as Record<string, string>;
      expect(langs.en, `${entry.url} en`).toMatch(/^https:\/\/code2img\.app/);
      expect(langs.fr, `${entry.url} fr`).toMatch(/^https:\/\/code2img\.app\/fr/);
      expect(langs["x-default"] ?? "", `${entry.url} x-default`).toBe(langs.en);
    }
  });

  it("keeps the /fr and / entries reciprocal", () => {
    const root = entries.find((e) => e.url === "https://code2img.app/")!;
    const fr = entries.find((e) => e.url === "https://code2img.app/fr")!;
    expect(root.alternates).toEqual(fr.alternates);
  });

  it("lists every programmatic page", () => {
    const urls = entries.map((e) => e.url);
    for (const v of VS) expect(urls).toContain(`https://code2img.app${v.path}`);
    expect(urls.filter((u) => u.includes("/code-screenshot/"))).toHaveLength(10);
  });
});

describe("SEO-004 internal linking", () => {
  const footerHtml = footer("en");

  it("links every comparison from the footer", () => {
    for (const v of VS) expect(footerHtml).toContain(`href="${v.path}"`);
  });

  it("cross-links comparisons and lists every language guide", () => {
    for (const v of VS) {
      const html = comparisonPage(v.slug)!;
      expect(html, `${v.path} renders`).toContain("Code screenshots by language");
      for (const other of VS.filter((o) => o.slug !== v.slug)) {
        expect(html, `${v.path} -> ${other.path}`).toContain(`href="${other.path}"`);
      }
    }
  });

  it("links all 13 programmatic URLs from a single crawl of the two templates", () => {
    const reachable = new Set<string>();
    for (const v of VS) {
      for (const m of comparisonPage(v.slug)!.matchAll(/href="(\/[^"]+)"/g)) reachable.add(m[1] ?? "");
    }
    for (const m of languagePage("typescript")!.matchAll(/href="(\/[^"]+)"/g)) reachable.add(m[1] ?? "");
    for (const v of VS) expect(reachable).toContain(v.path);
    for (const slug of ["typescript", "python", "go", "rust", "sql", "shell", "java", "csharp", "php", "ruby"]) {
      expect(reachable).toContain(`/code-screenshot/${slug}`);
    }
  });

  it("links the comparisons back from a language guide", () => {
    const html = languagePage("python")!;
    for (const v of VS) expect(html).toContain(`href="${v.path}"`);
  });
});

describe("SEO-002 social metadata", () => {
  it("gives /editor an og:image of its own", async () => {
    const { metadata } = await import("../app/editor/page");
    expect(metadata.openGraph?.images).toEqual([
      { url: "/og.png", width: 1200, height: 630, alt: "Code2Img — online code screenshot editor" },
    ]);
    expect(metadata.twitter?.images).toEqual(["/og.png"]);
  });

  it("declares twitter:title and twitter:description on the marketing pages", () => {
    const html = comparisonPage("carbon")!;
    expect(html).toContain('<meta name="twitter:title" content="Code2Img vs Carbon — Code2Img">');
    expect(html).toMatch(/<meta name="twitter:description" content="Carbon made the code screenshot a genre/);
  });
});

describe("SEO-005 repository discoverability", () => {
  it("ships an MIT LICENSE at the repo root and a package.json license field", () => {
    const licensePath = path.join(REPO, "LICENSE");
    expect(existsSync(licensePath)).toBe(true);
    expect(readFileSync(licensePath, "utf8")).toContain("MIT License");
    expect(JSON.parse(readFileSync(path.join(REPO, "package.json"), "utf8")).license).toBe("MIT");
  });

  it("anchors the README toward the site with target terms", () => {
    const readme = readFileSync(path.join(REPO, "README.md"), "utf8");
    expect(readme).toContain(">Online code screenshot editor</a>");
    expect(readme).toContain("[online code screenshot editor](https://code2img.app)");
    expect(readme).toContain('<a href="https://code2img.app/docs">Code to image API</a>');
    expect(readme).toContain("<a href=\"https://code2img.app/mcp\">MCP server for code screenshots</a>");
  });
});
