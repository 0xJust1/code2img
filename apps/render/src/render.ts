import { chromium, type Browser } from "playwright";
import { buildCardHtml, type CardConfig } from "@code2img/shared";

export const RENDER_TIMEOUT_MS = 15_000;

export type Format = "png" | "jpg" | "pdf";

export interface RenderRequest {
  config: CardConfig;
  format: Format;
  scale: 1 | 2 | 3 | 4;
  quality: number; // 1-100, jpg only
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

export async function renderImage(req: RenderRequest, selfOrigin: string): Promise<RenderResult> {
  const html = await buildCardHtml(req.config, { fontBaseUrl: selfOrigin });
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
