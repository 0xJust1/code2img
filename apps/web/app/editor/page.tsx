import type { Metadata } from "next";
import Editor from "./editor";
import "../app.css";

// /editor is a public page in the sitemap: it needs its own title, description and canonical
// instead of inheriting the homepage metadata.
export const metadata: Metadata = {
  title: "Online code screenshot editor",
  description:
    "Paste a snippet, pick from 18 syntax themes and 7 code fonts, customize the background, then export a 2× or 4× PNG, JPG or PDF code image.",
  alternates: { canonical: "/editor" },
  // A page-level openGraph REPLACES the root layout's object instead of merging into it: without
  // images here, /editor shipped twitter:image but no og:image at all (SEO-002).
  openGraph: {
    title: "Online code screenshot editor",
    description: "Paste a snippet, pick a theme, and export crisp PNG, JPG or PDF code images.",
    url: "/editor",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Code2Img — online code screenshot editor" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Online code screenshot editor",
    description: "Paste a snippet, pick a theme, and export crisp PNG, JPG or PDF code images.",
    images: ["/og.png"],
  },
};

export default function Page() {
  return <Editor />;
}
