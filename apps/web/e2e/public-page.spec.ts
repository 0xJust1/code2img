// Public share page: OG/Twitter/Farcaster metadata, the image itself, and the
// expiry/deletion 404s. Seeds rows directly (no auth round-trip) in a dedicated
// E2E database; see README for the provisioning one-liner.
import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { expect, test, type APIRequestContext } from "@playwright/test";
import postgres from "postgres";

const DB_URL = process.env.E2E_DATABASE_URL;
const APP_URL = process.env.E2E_APP_URL ?? "http://localhost:3000";
// The web server and these specs share apps/web as cwd (see playwright.config.ts).
const SHARE_DIR = process.env.E2E_SHARE_IMAGES_DIR ?? path.resolve(process.cwd(), ".e2e-data/share");

const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8AAAwAB/AF/9E1WAAAAAElFTkSuQmCC",
  "base64",
);
const SLUGS = { active: "e2e-active1", expired: "e2e-expired", deleted: "e2e-deletd1" };
const OWNER = "u_e2e_owner";

test.skip(!DB_URL, "E2E_DATABASE_URL not set: public-page specs need a Postgres test database");

const sql = DB_URL ? postgres(DB_URL, { max: 1 }) : null;

async function seed(slug: string, opts: { expiresAt?: Date; deletedAt?: Date }) {
  const storageKey = `${slug}.png`;
  await mkdir(SHARE_DIR, { recursive: true });
  await writeFile(path.join(SHARE_DIR, storageKey), PNG);
  const imageId = `img_${slug}`;
  const configHash = createHash("sha256").update(JSON.stringify({ code: "", theme: "github-dark" })).digest("hex");
  await sql!`insert into "user" (id, name, email) values (${OWNER}, 'E2E', 'e2e@example.com') on conflict do nothing`;
  await sql!`delete from share_link where slug = ${slug}`;
  await sql!`delete from image where id = ${imageId}`;
  await sql!`insert into image (id, user_id, config_hash, config, storage_key, format)
             values (${imageId}, ${OWNER}, ${configHash}, null, ${storageKey}, 'png')`;
  await sql!`insert into share_link (id, image_id, slug, expires_at, deleted_at, utm)
             values (${`link_${slug}`}, ${imageId}, ${slug}, ${opts.expiresAt ?? null}, ${opts.deletedAt ?? null},
                     ${JSON.stringify({ campaign: "e2e" })}::jsonb)`;
}

async function fetchImage(request: APIRequestContext, slug: string) {
  return request.get(`${APP_URL}/i/${slug}/image`);
}

test.beforeAll(async () => {
  if (!sql) return;
  await seed(SLUGS.active, {});
  await seed(SLUGS.expired, { expiresAt: new Date(Date.now() - 60_000) });
  await seed(SLUGS.deleted, { deletedAt: new Date(Date.now() - 60_000) });
});

test.afterAll(async () => {
  await sql?.end({ timeout: 5 });
});

test("public page ships OG, Twitter and Farcaster metadata and serves the image", async ({ page, request }) => {
  const res = await page.goto(`/i/${SLUGS.active}`);
  expect(res!.status()).toBe(200);

  const image = `${APP_URL}/i/${SLUGS.active}/image`;
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", image);
  await expect(page.locator('meta[property="og:type"]')).toHaveAttribute("content", "website");
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute("content", "summary_large_image");
  await expect(page.locator('meta[name="twitter:image"]')).toHaveAttribute("content", image);
  const frame = JSON.parse((await page.locator('meta[property="fc:frame"]').getAttribute("content"))!);
  expect(frame.version).toBe("next");
  expect(frame.imageUrl).toBe(image);

  const img = await fetchImage(request, SLUGS.active);
  expect(img.status()).toBe(200);
  expect(img.headers()["content-type"]).toBe("image/png");
  expect(Buffer.compare(await img.body(), PNG)).toBe(0);
});

test("share bar links carry utm_source per network", async ({ page }) => {
  await page.goto(`/i/${SLUGS.active}`);
  const bar = page.getByRole("region", { name: "Share this image" });

  // Intent URLs encode the target URL, so decode before reading the UTM params.
  const target = (href: string) => decodeURIComponent(href).replace(/\+/g, " ");
  await expect(bar.getByRole("link", { name: "X" })).toHaveAttribute("href", /utm_source%3Dx%26utm_medium%3Dsocial%26utm_campaign%3De2e/);
  expect(target((await bar.getByRole("link", { name: "X" }).getAttribute("href"))!)).toContain(
    "utm_source=x&utm_medium=social&utm_campaign=e2e",
  );
  await expect(bar.getByRole("link", { name: "LinkedIn" })).toHaveAttribute("href", /linkedin\.com\/sharing/);
  await expect(bar.getByRole("link", { name: "Facebook" })).toHaveAttribute("href", /facebook\.com\/sharer/);
  await expect(bar.getByRole("link", { name: "Mastodon" })).toHaveAttribute("href", /\/share\?text=/);
  await expect(bar.getByRole("link", { name: "Farcaster" })).toHaveAttribute("href", /warpcast\.com/);
  await expect(bar.getByRole("link", { name: "Bluesky" })).toHaveAttribute("href", /bsky\.app/);
  await expect(bar.getByRole("link", { name: "Threads" })).toHaveAttribute("href", /threads\.net/);
  await expect(bar.getByRole("link", { name: "Hacker News" })).toHaveAttribute("href", /utm_source%3Dhn/);
  await expect(bar.getByRole("link", { name: "Telegram" })).toHaveAttribute("href", /t\.me/);
  await expect(bar.getByRole("link", { name: "WhatsApp" })).toHaveAttribute("href", /wa\.me/);
  await expect(bar.getByRole("link", { name: "Email" })).toHaveAttribute("href", /^mailto:/);
  await expect(bar.getByRole("button", { name: "Copy link" })).toBeVisible();
});

test("expired and deleted links are 404 for the page and the image", async ({ page, request }) => {
  for (const slug of [SLUGS.expired, SLUGS.deleted]) {
    expect((await page.goto(`/i/${slug}`))!.status()).toBe(404);
    expect((await fetchImage(request, slug)).status()).toBe(404);
  }
});