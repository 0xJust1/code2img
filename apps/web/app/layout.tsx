import type { Metadata, Viewport } from "next";
import "./globals.css";
import { APP_NAME } from "@code2img/shared";
import { siteUrl } from "@/lib/share";
import { REVEAL_JS } from "./reveal";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: `${APP_NAME} — code to image, with an API and an MCP server`,
    template: `%s — ${APP_NAME}`,
  },
  description: `Turn a code snippet into a PNG, JPG or PDF: pick a theme, export, or render it from the REST API and the MCP server.`,
  applicationName: APP_NAME,
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/brand/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: [{ url: "/brand/apple-touch-icon.png", sizes: "180x180" }],
  },
  openGraph: {
    type: "website",
    siteName: APP_NAME,
    images: [{ url: "/og.png", width: 1200, height: 630, alt: `${APP_NAME} — code to image` }],
  },
  twitter: { card: "summary_large_image", images: ["/og.png"] },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#08090a",
  colorScheme: "dark light",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <script dangerouslySetInnerHTML={{ __html: REVEAL_JS }} />
      </body>
    </html>
  );
}