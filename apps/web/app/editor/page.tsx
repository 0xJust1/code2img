import type { Metadata } from "next";
import Editor from "./editor";
import { siteUrl } from "@/lib/share";
import "../app.css";

// /editor is a public page in the sitemap: it needs its own title, description and canonical
// instead of inheriting the homepage metadata.
export const metadata: Metadata = {
  title: "Free code screenshot editor, no sign-up",
  description:
    "Make a code screenshot worth sharing: pick from 18 themes and 7 fonts, style the background, export a crisp PNG, JPG or PDF. Free, no account needed.",
  alternates: { canonical: "/editor" },
  // A page-level openGraph REPLACES the root layout's object instead of merging into it: without
  // images here, /editor shipped twitter:image but no og:image at all (SEO-002).
  openGraph: {
    title: "Online code screenshot editor",
    description: "Make a code screenshot worth sharing: pick from 18 themes and 7 fonts, style the background, export a crisp PNG, JPG or PDF. Free, no account needed.",
    url: "/editor",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Code2Img — online code screenshot editor" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Online code screenshot editor",
    description: "Make a code screenshot worth sharing: pick from 18 themes and 7 fonts, style the background, export a crisp PNG, JPG or PDF. Free, no account needed.",
    images: ["/og.png"],
  },
};

// Structured data (audit `structured_data_missing`): /editor is the WebApplication the site offers.
const EDITOR_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Code2Img editor",
  url: `${siteUrl()}/editor`,
  applicationCategory: "DeveloperApplication",
  operatingSystem: "Web",
  description:
    "Paste a code snippet, pick from 18 syntax themes and 7 code fonts, customize the background, then export a 2× or 4× PNG, JPG or PDF code image.",
  offers: { "@type": "Offer", price: "0", priceCurrency: "EUR", name: "Free" },
};

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(EDITOR_JSON_LD) }}
      />
      <Editor />
    </>
  );
}
