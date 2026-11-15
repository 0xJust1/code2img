import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/share";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  const now = new Date();
  // Only real, indexable pages: no /dashboard, no /i/<slug> (user content), no /api.
  return [
    { url: `${base}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/pricing`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/editor`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/docs`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/mcp`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
  ];
}