import { expect, test } from "@playwright/test";

import { DEMO_EMAIL, login, seedE2eDatabase } from "./seed";

test.beforeAll(async ({ request }) => {
  await seedE2eDatabase(request);
});

test("signed-out visitors are redirected away from the app", async ({ page }) => {
  await page.goto("/app");
  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
});

test("seeding is refused without an admin session", async ({ request }) => {
  const response = await request.post("/api/seed");
  expect(response.status()).toBe(403);
});

test("a creator is kept out of the admin console", async ({ page }) => {
  await login(page, "asha@example.dev");
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/app$/);

  await page.goto("/admin/reports");
  await expect(page).toHaveURL(/\/app$/);

  // The sidebar link is hidden for non-admins too.
  await page.goto("/app");
  await expect(page.getByRole("link", { name: "Admin" })).toHaveCount(0);
});

test("customers only see bookings they sent", async ({ page }) => {
  await login(page, "demo@sho-vee.dev");
  await page.goto("/app/bookings");

  const asCustomer = page.locator("section").filter({
    has: page.getByRole("heading", { name: "As a customer" }),
  });
  await expect(asCustomer.getByRole("listitem")).toHaveCount(2);
  // The demo customer booked two creators but is not one, so nothing is addressed to them.
  await expect(page.getByText("No booking requests yet.")).toBeVisible();
});

test("a creator sees the requests addressed to them", async ({ page }) => {
  await login(page, "vikram@example.dev");
  await page.goto("/app/bookings");

  const asCreator = page.locator("section").filter({
    has: page.getByRole("heading", { name: "As a creator" }),
  });
  await expect(asCreator.getByText("Need reels edited")).toBeVisible();
  await expect(asCreator.getByRole("button", { name: "Accept" })).toBeVisible();
});

test("reporting someone else's post is acknowledged", async ({ page }) => {
  await login(page, "asha@example.dev");
  await page.goto("/shots");

  const card = page.locator("li").filter({ hasText: "Meera Iyer" }).first();
  page.once("dialog", (dialog) => dialog.accept("Undisclosed commercial watermark"));
  await card.getByRole("button", { name: "Report", exact: true }).click();

  await expect(card.getByText("Reported", { exact: true })).toBeVisible();
});

test("reporting your own post is refused", async ({ page }) => {
  await login(page, "asha@example.dev");
  await page.goto("/shots");

  const card = page.locator("li").filter({ hasText: "Asha Rao" }).first();
  page.once("dialog", (dialog) => dialog.accept("Testing my own upload"));
  await card.getByRole("button", { name: "Report", exact: true }).click();

  await expect(page.getByText("You cannot report your own content.")).toBeVisible();
});

test("adding the same gear twice reuses one catalogue entry", async ({ page }) => {
  await login(page, "asha@example.dev");
  await page.goto("/app/equipment");

  await page.getByLabel("Name").fill("zoom h1n");
  await page.getByLabel("Brand").fill("Nikon");
  await page.getByLabel("Model").fill("Z9H");
  await page.getByRole("button", { name: "Add equipment" }).click();
  await expect(page.getByText("Nikon zoom h1n")).toBeVisible();

  // Same gear, different casing: the catalogue identity index has to resolve it to one row.
  await page.getByLabel("Name").fill("Zoom H1N");
  await page.getByLabel("Brand").fill("nikon");
  await page.getByLabel("Model").fill("z9h");
  await page.getByRole("button", { name: "Add equipment" }).click();

  await expect(page.getByText("Nikon zoom h1n")).toHaveCount(1);
});

test("completing a booking tells the customer it is reviewable", async ({ page }) => {
  await login(page, "vikram@example.dev");
  await page.goto("/app/bookings");

  const asCreator = page.locator("section").filter({
    has: page.getByRole("heading", { name: "As a creator" }),
  });
  await asCreator.getByRole("button", { name: "Accept" }).click();
  await asCreator.getByRole("button", { name: "Mark completed" }).click();

  await login(page, "demo@sho-vee.dev");
  await page.getByRole("button", { name: "Notifications" }).click();
  await expect(page.getByText("Booking completed")).toBeVisible();
  await expect(page.getByText("leave a review")).toBeVisible();
});

test("moderation tells the creator their post was removed", async ({ page }) => {
  await login(page, DEMO_EMAIL);
  await page.goto("/admin");

  // The admin list is newest first, and the seed inserts posts in creator order, so the first row
  // belongs to Kabir Singh.
  const posts = page.locator("section").filter({
    has: page.getByRole("heading", { name: "Posts" }),
  });
  await posts.getByRole("listitem").first().getByRole("button", { name: "Remove" }).click();

  await login(page, "kabir@example.dev");
  await page.getByRole("button", { name: "Notifications" }).click();
  await expect(page.getByText("Post removed")).toBeVisible();
});

test("resolving a report reaches the reporter", async ({ page }) => {
  await login(page, DEMO_EMAIL);
  await page.goto("/admin/reports");
  await expect(page.getByText("Undisclosed commercial watermark")).toBeVisible();

  await page.getByRole("button", { name: "Mark reviewed" }).click();
  await expect(page.getByText("No open reports.")).toBeVisible();

  await login(page, "asha@example.dev");
  await page.getByRole("button", { name: "Notifications" }).click();
  await expect(page.getByText("Report reviewed")).toBeVisible();
});
