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
  openGraph: {
    title: "Online code screenshot editor",
    description: "Paste a snippet, pick a theme, and export crisp PNG, JPG or PDF code images.",
    url: "/editor",
  },
};

export default function Page() {
  return <Editor />;
}
