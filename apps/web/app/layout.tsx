import type { Metadata } from "next";
import "./globals.css";
import { APP_NAME } from "@code2img/shared";
import { siteUrl } from "@/lib/share";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: `${APP_NAME} — turn code into beautiful images`,
  description: `Paste code, pick a theme, export a pixel-perfect PNG/JPG/PDF. Built with ${APP_NAME}.`,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
