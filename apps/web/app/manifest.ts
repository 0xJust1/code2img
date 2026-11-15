import type { MetadataRoute } from "next";
import { APP_NAME } from "@code2img/shared";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${APP_NAME} — code to image`,
    short_name: APP_NAME,
    description: "Turn a code snippet into a PNG, JPG or PDF, share a link, or render it from the API or an MCP server.",
    start_url: "/",
    display: "standalone",
    background_color: "#08090a",
    theme_color: "#08090a",
    icons: [
      { src: "/brand/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/brand/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/favicon.svg", sizes: "any", type: "image/svg+xml" },
    ],
  };
}