import type { MetadataRoute } from "next";
import { APP_NAME } from "@code2img/shared";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${APP_NAME} — code to image`,
    short_name: APP_NAME,
    description: "Turn code into pixel-perfect images, shareable links, an API and an MCP server.",
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