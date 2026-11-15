// Public share page /i/[slug]: the image, its social preview metadata, and the share bar.
// expiring/deleted links are a 404 — the public has no other view of them.
import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { getDb } from "@code2img/db";
import { APP_NAME } from "@code2img/shared";
import { getAuth } from "@/lib/auth";
import { loadShare } from "@/lib/share-db";
import { publicUrl, shareImageUrl, siteUrl, trackedUrl } from "@/lib/share";
import { SHARE_NETWORKS } from "@/lib/share-networks";
import ShareBar, { OwnerDelete } from "../../share-bar";

export const dynamic = "force-dynamic"; // expiry + deletion must be visible immediately

async function findShare(slug: string) {
  const db = getDb();
  return db ? loadShare(db, decodeURIComponent(slug)) : null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const share = await findShare(slug);
  if (!share || share.state !== "active") return { title: `${APP_NAME} — image not found`, robots: { index: false } };
  const title = `Code image shared with ${APP_NAME}`;
  const description = `${APP_NAME} — paste code, pick a theme, export a pixel-perfect image.`;
  const image = shareImageUrl(share.slug);
  return {
    title,
    description,
    alternates: { canonical: publicUrl(share.slug) },
    openGraph: {
      type: "website",
      url: publicUrl(share.slug),
      title,
      description,
      images: [{ url: image, alt: title }],
    },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

// Farcaster/Warpcast embeds read `property="fc:frame"` (JSON) — Next's `other` map emits
// `name=`, so the tag is rendered in the page itself and hoisted to <head> by React 19.
function frameMeta(slug: string) {
  return JSON.stringify({
    version: "next",
    imageUrl: shareImageUrl(slug),
    button: { title: "Make your own", action: { type: "launch_frame", name: APP_NAME, url: siteUrl() } },
  });
}

export default async function SharePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const share = await findShare(slug);
  if (!share || share.state !== "active") notFound();

  const auth = getAuth();
  const session = auth ? await auth.api.getSession({ headers: await headers() }).catch(() => null) : null;
  const isOwner = Boolean(session?.user?.id) && session!.user.id === share.ownerId;
  const urls: Record<string, string> = {
    copy: publicUrl(share.slug),
    mastodon: trackedUrl(share.slug, "mastodon", share.utm),
  };
  for (const n of SHARE_NETWORKS) urls[n.id] = trackedUrl(share.slug, n.id, share.utm);

  return (
    <main className="share-page">
      <meta property="fc:frame" content={frameMeta(share.slug)} />
      <img src={`/i/${share.slug}/image`} alt={`Code image shared with ${APP_NAME}`} />
      <div className="share-meta">
        <span>
          {share.expiresAt ? `Expires ${share.expiresAt.toISOString().slice(0, 10)}` : "Never expires"}
        </span>
        <a className="ghost" href={`/i/${share.slug}/image`} download={`code2img-${share.slug}.${share.format}`}>
          Download {share.format.toUpperCase()}
        </a>
        <a className="ghost" href="/editor">
          Create your own
        </a>
        {isOwner && <OwnerDelete slug={share.slug} />}
      </div>
      <ShareBar urls={urls} />
    </main>
  );
}