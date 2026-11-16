import type { Metadata } from "next";

// /login is a client component and cannot export metadata: this layout keeps the page out of
// the index (it duplicates the homepage title otherwise).
export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
