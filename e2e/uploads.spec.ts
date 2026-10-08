import { expect, test } from "@playwright/test";

import { login, seedE2eDatabase } from "./seed";

test.beforeAll(async ({ request }) => {
  await seedE2eDatabase(request);
});

/**
 * A real 1×1 PNG.
 *
 * It has to be a genuine image rather than a header-shaped stub: the Studio preview renders what it
 * was given, so a file the browser cannot decode would show the "could not be loaded" state and the
 * test would pass for the wrong reason.
 */
const PNG_1X1 = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

test("signed-out visitors cannot upload", async ({ request }) => {
  const response = await request.post("/api/uploads", {
    multipart: { file: { name: "shot.png", mimeType: "image/png", buffer: PNG_1X1 } },
  });
  expect(response.status()).toBe(401);
});

test("a creator uploads a photo and it appears on their public profile", async ({ page }) => {
  await login(page, "asha@example.dev");
  await page.goto("/app/portfolio");

  await page.getByLabel("Title").fill("Uploaded from the camera roll");
  await page.locator('input[type="file"]').setInputFiles({
    name: "golden-hour.png",
    mimeType: "image/png",
    buffer: PNG_1X1,
  });

  // The stored URL lands in the field, so saving the item needs no further thought, and the preview
  // shows the stored file rather than a pasted link.
  const mediaUrl = page.getByLabel("Media URL");
  await expect(mediaUrl).toHaveValue(/^\/uploads\/[\w-]+\.(png|webp|jpg|avif)$/);
  const url = await mediaUrl.inputValue();
  await expect(page.locator(`img[src="${url}"]`)).toBeVisible();

  // The category chips have no default, so the item is not valid until one is picked.
  await page.getByRole("radio", { name: "Wedding" }).check({ force: true });
  await page.getByRole("button", { name: "Add to portfolio" }).click();
  await expect(page.getByText("Portfolio item added.")).toBeVisible();

  // The public profile renders it, which means the bytes really are being served.
  await page.goto("/creators");
  await page
    .getByRole("link", { name: /Asha Rao/ })
    .first()
    .click();
  await page.waitForURL("**/creators/**");
  await expect(page.getByRole("img", { name: "Uploaded from the camera roll" })).toBeVisible();

  const served = await page.request.get(url);
  expect(served.status()).toBe(200);
  expect(served.headers()["content-type"]).toMatch(/^image\//);
  expect(served.headers()["x-content-type-options"]).toBe("nosniff");
});

test("a file that is not an image is refused with a reason", async ({ page }) => {
  await login(page, "asha@example.dev");
  await page.goto("/app/portfolio");

  await page.locator('input[type="file"]').setInputFiles({
    name: "sneaky.svg",
    mimeType: "image/svg+xml",
    buffer: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'),
  });

  // The declared type is ignored; the bytes are SVG, so this never becomes an upload.
  await expect(page.getByRole("alert")).toContainText("JPEG, PNG, WebP or AVIF");
});

test("an upload key that was never issued is not served", async ({ request }) => {
  for (const key of [
    "2026-10-00000000-0000-4000-8000-000000000000.png",
    "2026-10-../../../../etc/passwd",
    "not-a-key",
  ]) {
    const response = await request.get(`/uploads/${key}`);
    expect(response.status()).toBe(404);
  }
});
