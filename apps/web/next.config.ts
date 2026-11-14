import type { NextConfig } from "next";

// Single pipeline: the editor proxies export calls to the render service (no client-side rendering).
const renderUrl = process.env.RENDER_URL ?? "http://localhost:3002";

const nextConfig: NextConfig = {
  transpilePackages: ["@code2img/shared"],
  async rewrites() {
    // /api/render is a route handler now (auth + entitlements live there).
    return [{ source: "/api/fonts/:file", destination: `${renderUrl}/fonts/:file` }];
  },
};

export default nextConfig;
