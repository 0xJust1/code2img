import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/share";

// Per-user-agent groups do not inherit the `*` block (RFC 9309): every named crawler repeats
// the same disallow list, or it would be allowed to crawl /dashboard, /login, /api/ and /i/.
const DISALLOW = ["/dashboard", "/login", "/api/", "/i/"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: DISALLOW },
      { userAgent: "GPTBot", allow: "/", disallow: DISALLOW },
      { userAgent: "ClaudeBot", allow: "/", disallow: DISALLOW },
      { userAgent: "PerplexityBot", allow: "/", disallow: DISALLOW },
      { userAgent: "Google-Extended", allow: "/", disallow: DISALLOW },
    ],
    sitemap: `${siteUrl()}/sitemap.xml`,
    // The Host directive takes a bare hostname, never a scheme.
    host: siteUrl().replace(/^https?:\/\//, ""),
  };
}
