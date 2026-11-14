import type { NextConfig } from "next";

// Single pipeline: the editor proxies export calls to the render service (no client-side rendering).
const renderUrl = process.env.RENDER_URL ?? "http://localhost:3002";

const nextConfig: NextConfig = {
  transpilePackages: ["@code2img/shared"],
  async rewrites() {
    return [
      { source: "/api/render", destination: `${renderUrl}/render` },
      { source: "/api/fonts/:file", destination: `${renderUrl}/fonts/:file` },
    ];
  },
};

export default nextConfig;
