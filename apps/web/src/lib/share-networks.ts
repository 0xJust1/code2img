// Share intents: one table shared by the public page (server) and the share bar (client).
// No node imports here — this file is bundled for the browser.
const enc = encodeURIComponent;

export const SHARE_TEXT = "Code image made with Code2Img";

export interface ShareNetwork {
  id: string;
  label: string;
  href: (url: string, text: string) => string;
}

export const SHARE_NETWORKS: readonly ShareNetwork[] = [
  { id: "x", label: "X", href: (u, t) => `https://x.com/intent/post?text=${enc(t)}&url=${enc(u)}` },
  { id: "linkedin", label: "LinkedIn", href: (u) => `https://www.linkedin.com/sharing/share-offsite/?url=${enc(u)}` },
  { id: "facebook", label: "Facebook", href: (u) => `https://www.facebook.com/sharer/sharer.php?u=${enc(u)}` },
  { id: "farcaster", label: "Farcaster", href: (u, t) => `https://warpcast.com/~/compose?text=${enc(t)}&embeds[]=${enc(u)}` },
  { id: "reddit", label: "Reddit", href: (u, t) => `https://www.reddit.com/submit?url=${enc(u)}&title=${enc(t)}` },
  { id: "bluesky", label: "Bluesky", href: (u, t) => `https://bsky.app/intent/compose?text=${enc(`${t} ${u}`)}` },
  { id: "threads", label: "Threads", href: (u, t) => `https://www.threads.net/intent/post?text=${enc(`${t} ${u}`)}` },
  { id: "hn", label: "Hacker News", href: (u, t) => `https://news.ycombinator.com/submitlink?u=${enc(u)}&t=${enc(t)}` },
  { id: "telegram", label: "Telegram", href: (u, t) => `https://t.me/share/url?url=${enc(u)}&text=${enc(t)}` },
  { id: "whatsapp", label: "WhatsApp", href: (u, t) => `https://wa.me/?text=${enc(`${t} ${u}`)}` },
  { id: "email", label: "Email", href: (u, t) => `mailto:?subject=${enc(t)}&body=${enc(u)}` },
];