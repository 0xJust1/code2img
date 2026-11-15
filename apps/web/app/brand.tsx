// Brand assets: the mark is a pair of brackets holding a filled square — code in, image out.
// Chevrons take the ink, the square takes the accent (the only accent on chrome).
import { APP_NAME } from "@code2img/shared";

export function Mark({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" focusable="false" style={{ display: "block", flex: "none" }}>
      <g fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.6 8.6 4 16l6.6 7.4" />
        <path d="M21.4 8.6 28 16l-6.6 7.4" />
      </g>
      <rect x="12.9" y="12.9" width="6.2" height="6.2" rx="1.6" fill="var(--accent)" />
    </svg>
  );
}

export function Wordmark({ href = "/" }: { href?: string }) {
  return (
    <a href={href} className="wordmark" aria-label={`${APP_NAME} — code to image`}>
      <Mark size={22} />
      <span>
        Code<span className="wordmark-two">2</span>Img
      </span>
    </a>
  );
}