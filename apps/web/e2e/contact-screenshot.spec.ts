import { test, expect } from "@playwright/test";

const host = process.env.PUBLIC_HOST ?? "code2img.app";
const base = process.env.PUBLIC_URL ?? "http://127.0.0.1:3335";

for (const p of ["/contact", "/fr/contact"]) {
  test(`screenshot ${p}`, async ({ page }) => {
    await page.setExtraHTTPHeaders({ Host: host });
    await page.goto(`${base}${p}`, { waitUntil: "networkidle" });
    await page.screenshot({ path: `test-results/snap-${p.replace(/\//g, "-")}.png`, fullPage: false });
    // Smoke checks
    await expect(page.locator('form#cf')).toBeVisible();
    await expect(page.locator('input[name="name"]')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('textarea[name="message"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });
}
