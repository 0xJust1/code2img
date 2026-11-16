import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/share";
import { BLOG_POSTS, LANGUAGES, VS } from "./site/pages";

// Only real, indexable pages: no /dashboard, no /i/<slug> (user content), no /api/v1.
// A fixed date, not new Date(): a lastmod that changes on every request tells crawlers the whole
// site changed at each hit and defeats their caching. Bump it when content ships.
const LAST_MODIFIED = new Date("2026-11-16");

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  const fr = (path: string) => `${base}${path === "/" ? "/fr" : `/fr${path}`}`;
  const en = (path: string) => `${base}${path === "/" ? "/" : path}`;
  const languages = (path: string) => ({ languages: { en: en(path), fr: fr(path) } });

  /** Both language versions, each with its own <loc> plus the reciprocal hreflang links. */
  const bilingual = (path: string, priority: number, changeFrequency: "weekly" | "monthly") => [
    { url: en(path), lastModified: LAST_MODIFIED, changeFrequency, priority, alternates: languages(path) },
    { url: fr(path), lastModified: LAST_MODIFIED, changeFrequency, priority, alternates: languages(path) },
  ];

  return [
    ...bilingual("/", 1, "weekly"),
    ...bilingual("/pricing", 0.8, "monthly"),
    { url: en("/editor"), lastModified: LAST_MODIFIED, changeFrequency: "monthly", priority: 0.9 },
    { url: en("/api"), lastModified: LAST_MODIFIED, changeFrequency: "monthly", priority: 0.7 },
    { url: en("/docs"), lastModified: LAST_MODIFIED, changeFrequency: "monthly", priority: 0.6 },
    { url: en("/mcp"), lastModified: LAST_MODIFIED, changeFrequency: "monthly", priority: 0.6 },
    { url: en("/blog"), lastModified: LAST_MODIFIED, changeFrequency: "weekly", priority: 0.6 },
    ...BLOG_POSTS.map((p) => ({
      url: en(p.path),
      lastModified: p.updated ? new Date(p.updated) : LAST_MODIFIED,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
    { url: en("/changelog"), lastModified: LAST_MODIFIED, changeFrequency: "weekly", priority: 0.5 },
    ...LANGUAGES.map((l) => ({
      url: en(`/code-screenshot/${l.slug}`),
      lastModified: LAST_MODIFIED,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    ...VS.map((v) => ({
      url: en(v.path),
      lastModified: LAST_MODIFIED,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    { url: en("/legal/terms"), lastModified: LAST_MODIFIED, changeFrequency: "yearly", priority: 0.2 },
    { url: en("/legal/privacy"), lastModified: LAST_MODIFIED, changeFrequency: "yearly", priority: 0.2 },
    {
      url: en("/legal/mentions"),
      lastModified: LAST_MODIFIED,
      changeFrequency: "yearly",
      priority: 0.2,
      alternates: languages("/legal/mentions"),
    },
    {
      url: fr("/legal/mentions"),
      lastModified: LAST_MODIFIED,
      changeFrequency: "yearly",
      priority: 0.2,
      alternates: languages("/legal/mentions"),
    },
    ...bilingual("/contact", 0.4, "monthly"),
  ];
}
