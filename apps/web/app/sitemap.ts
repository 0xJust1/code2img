import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/share";
import { BLOG_POSTS, LANGUAGES, VS } from "./site/pages";

// Only real, indexable pages: no /dashboard, no /i/<slug> (user content), no /api/v1.
export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  const now = new Date();
  const fr = (path: string) => `${base}${path === "/" ? "/fr" : `/fr${path}`}`;
  const en = (path: string) => `${base}${path === "/" ? "/" : path}`;

  const bilingual = (path: string, priority: number, changeFrequency: "weekly" | "monthly") => ({
    url: en(path),
    lastModified: now,
    changeFrequency,
    priority,
    alternates: { languages: { en: en(path), fr: fr(path) } },
  });

  return [
    bilingual("/", 1, "weekly"),
    bilingual("/pricing", 0.8, "monthly"),
    { url: en("/editor"), lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: en("/api"), lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: en("/docs"), lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: en("/mcp"), lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: en("/blog"), lastModified: now, changeFrequency: "weekly", priority: 0.6 },
    ...BLOG_POSTS.map((p) => ({
      url: en(p.path),
      lastModified: p.updated ? new Date(p.updated) : now,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
    { url: en("/changelog"), lastModified: now, changeFrequency: "weekly", priority: 0.5 },
    ...LANGUAGES.map((l) => ({
      url: en(`/code-screenshot/${l.slug}`),
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    ...VS.map((v) => ({
      url: en(v.path),
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    { url: en("/legal/terms"), lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: en("/legal/privacy"), lastModified: now, changeFrequency: "yearly", priority: 0.2 },
  ];
}
