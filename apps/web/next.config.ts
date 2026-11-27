import type { NextConfig } from "next";
import { DOMAIN } from "@code2img/shared";

// Single pipeline: the editor proxies export calls to the render service (no client-side rendering).
const renderUrl = process.env.RENDER_URL ?? "http://localhost:3002";

// One origin per document (SEO-001). www.code2img.app answered the very same HTML as the apex, so
// every page existed twice for a crawler; the canonical link alone does not remove the duplicate
// URL. The redirect lives here, in the routing layer, rather than in a middleware: no extra request
// hop, no edge bundle, and it applies to API routes as well as to pages. `permanent: true` answers
// 308, which preserves the method and the body of a POST.
const canonicalHostRedirect = {
  source: "/:path*",
  has: [{ type: "host" as const, value: `www.${DOMAIN}` }],
  destination: `https://${DOMAIN}/:path*`,
  permanent: true,
};

const nextConfig: NextConfig = {
  transpilePackages: ["@code2img/shared", "code2img-mcp"],
  async redirects() {
    return [canonicalHostRedirect];
  },
  // HSTS on every route (audit `hsts_missing`). `preload` is deliberately omitted: joining the
  // browser preload list is a hard-to-reverse commitment and is only enabled on an explicit go.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [{ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" }],
      },
    ];
  },
  async rewrites() {
    // /api/render is a route handler now (auth + entitlements live there).
    return [{ source: "/api/fonts/:file", destination: `${renderUrl}/fonts/:file` }];
  },
};

export default nextConfig;
