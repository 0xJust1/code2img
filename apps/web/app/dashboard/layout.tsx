import type { Metadata } from "next";

// /dashboard is a client component and cannot export metadata: noindex here so the page never
// shows up as a phantom URL indexed despite the robots.txt rule.
export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
