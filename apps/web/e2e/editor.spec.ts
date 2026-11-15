import { expect, test } from "@playwright/test";

test("editor -> live preview -> PNG export through the server pipeline", async ({ page }) => {
  await page.goto("/editor");
  await expect(page.getByRole("heading", { level: 2 }).first()).toBeVisible();

  // Live preview updates from the code textarea.
  const code = page.getByLabel("Code editor");
  await code.fill("print('hello from e2e')");
  await page.waitForTimeout(400);

  // Preset is serialized in the URL hash.
  await page.waitForTimeout(600);
  expect(page.url()).toContain("#");

  // Export hits the render service and returns a PNG.
  const resPromise = page.waitForResponse((r) => r.url().includes("/api/render"));
  await page.getByRole("button", { name: "Export" }).click();
  const res = await resPromise;
  expect(res.status()).toBe(200);
  expect(res.headers()["content-type"]).toBe("image/png");
  const buf = await res.body();
  expect(buf.length).toBeGreaterThan(1000);
  expect(buf.subarray(1, 4).toString()).toBe("PNG");
});
