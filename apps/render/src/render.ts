import { chromium, type Browser } from "playwright";
import { buildCardHtml, type CardConfig } from "@code2img/shared";
import { mkdtempSync, readFileSync, rmSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execSync } from "node:child_process";

export const RENDER_TIMEOUT_MS = 15_000;

export type Format = "png" | "jpg" | "pdf" | "webm" | "mp4";

export interface RenderRequest {
  config: CardConfig;
  format: Format;
  scale: 1 | 2 | 3 | 4;
  quality: number; // 1-100, jpg only
  /** Data URLs for uploaded assets; honored only for trusted (Pro) requests. */
  attachments?: Record<string, string>;
  /** Animation settings; used for video formats (webm, mp4, apng). */
  anim?: { type: "typewriter"; durationMs: number };
}

export interface RenderResult {
  buf: Buffer;
  mime: string;
  ext: string;
  bytes: number;
}

let browserPromise: Promise<Browser> | null = null;

function getBrowser(): Promise<Browser> {
  browserPromise ??= chromium.launch({
    args: ["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu", "--disable-extensions"],
  });
  return browserPromise;
}

async function measureViewport(html: string, selfOrigin: string, scale: number): Promise<{ width: number; height: number }> {
  const browser = await getBrowser();
  const context = await browser.newContext({ deviceScaleFactor: scale, viewport: { width: 1600, height: 1200 } });
  try {
    const page = await context.newPage();
    await page.route("**/*", (route) => {
      const url = route.request().url();
      if (url === "about:blank" || url.startsWith(selfOrigin)) return route.continue();
      return route.abort();
    });
    await page.setContent(html, { waitUntil: "load" });
    await page.evaluate(() => document.fonts.ready);
    const box = await page.locator("#capture").boundingBox();
    if (!box) throw new Error("capture element not found");
    const w = Math.ceil(box.width);
    const h = Math.ceil(box.height);
    return { width: w % 2 === 0 ? w : w + 1, height: h % 2 === 0 ? h : h + 1 };
  } finally {
    await context.close();
  }
}

export async function renderVideo(req: RenderRequest, selfOrigin: string): Promise<RenderResult> {
  const html = await buildCardHtml(req.config, { fontBaseUrl: selfOrigin, attachments: req.attachments, anim: req.anim });
  const { width, height } = await measureViewport(html, selfOrigin, req.scale);
  const tmpDir = mkdtempSync(join(tmpdir(), "c2i-video-"));
  const browser = await getBrowser();
  const context = await browser.newContext({
    deviceScaleFactor: req.scale,
    viewport: { width, height },
    recordVideo: { dir: tmpDir, size: { width, height } },
  });
  try {
    const page = await context.newPage();
    page.setDefaultTimeout(RENDER_TIMEOUT_MS);
    await page.route("**/*", (route) => {
      const url = route.request().url();
      if (url === "about:blank" || url.startsWith(selfOrigin)) return route.continue();
      return route.abort();
    });
    await page.setContent(html, { waitUntil: "load" });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(req.anim!.durationMs + 200); // small buffer after animation
  } finally {
    await context.close();
  }
  const files = readdirSync(tmpDir);
  const videoFile = files.find((f) => f.endsWith(".webm"));
  if (!videoFile) throw new Error("video file not found");
  const webmPath = join(tmpDir, videoFile);
  let buf: Buffer;
  let mime: string;
  let ext: string;
  if (req.format === "mp4") {
    const mp4Path = join(tmpDir, "output.mp4");
    execSync(
      `ffmpeg -y -i ${JSON.stringify(webmPath)} -c:v libx264 -preset fast -crf 23 -movflags +faststart -an -pix_fmt yuv420p ${JSON.stringify(mp4Path)}`,
      { stdio: "pipe" },
    );
    buf = readFileSync(mp4Path);
    mime = "video/mp4";
    ext = "mp4";
  } else {
    buf = readFileSync(webmPath);
    mime = "video/webm";
    ext = "webm";
  }
  rmSync(tmpDir, { recursive: true, force: true });
  return { buf, mime, ext, bytes: buf.byteLength };
}

export async function renderImage(req: RenderRequest, selfOrigin: string): Promise<RenderResult> {
  if (req.format === "webm" || req.format === "mp4") {
    if (!req.anim || req.anim.type !== "typewriter") throw new Error("animated format requires anim.type=typewriter");
    return renderVideo(req, selfOrigin);
  }
  const html = await buildCardHtml(req.config, { fontBaseUrl: selfOrigin, attachments: req.attachments });
  const browser = await getBrowser();
  const context = await browser.newContext({ deviceScaleFactor: req.scale, viewport: { width: 1600, height: 1200 } });
  try {
    const page = await context.newPage();
    page.setDefaultTimeout(RENDER_TIMEOUT_MS);
    // Sandbox: allow only requests to our own origin (self-hosted fonts). Abort everything else.
    await page.route("**/*", (route) => {
      const url = route.request().url();
      if (url === "about:blank" || url.startsWith(selfOrigin)) return route.continue();
      return route.abort();
    });
    await page.setContent(html, { waitUntil: "load" });
    await page.evaluate(() => document.fonts.ready);

    const el = page.locator("#capture");
    const transparent = req.config.background.type === "transparent";
    if (req.format === "pdf") {
      const buf = await page.pdf({ printBackground: true, pageRanges: "1" });
      return { buf, mime: "application/pdf", ext: "pdf", bytes: buf.byteLength };
    }
    const buf = await el.screenshot({
      type: req.format === "jpg" ? "jpeg" : "png",
      quality: req.format === "jpg" ? Math.min(100, Math.max(1, req.quality)) : undefined,
      omitBackground: transparent && req.format === "png",
    });
    return {
      buf,
      mime: req.format === "jpg" ? "image/jpeg" : "image/png",
      ext: req.format === "jpg" ? "jpg" : "png",
      bytes: buf.byteLength,
    };
  } finally {
    await context.close();
  }
}

export async function closeBrowser(): Promise<void> {
  if (browserPromise) (await browserPromise).close();
  browserPromise = null;
}
