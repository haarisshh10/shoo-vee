import { expect, test } from "@playwright/test";

import { login, seedE2eDatabase } from "./seed";

test.beforeAll(async ({ request }) => {
  await seedE2eDatabase(request);
});

test("landing page shows the brand promise and every marketplace section", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Create. Capture. Sell." })).toBeVisible();
  await expect(page.getByRole("link", { name: "Discover creators" })).toBeVisible();

  // The page is a marketplace, not a hero with nothing under it.
  await expect(page.getByRole("heading", { name: "Crews people keep booking" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Fresh from the community" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Find a specialist" })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Short-term crew work, posted now" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "From browsing to booked, without the back-and-forth." }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Join the marketplace" })).toBeVisible();
});

test("discover shows rich creator cards", async ({ page }) => {
  await page.goto("/discover");

  await expect(page.getByRole("heading", { name: "Discover creators" })).toBeVisible();

  const card = page.locator("li").filter({ hasText: "Asha Rao" }).first();
  await expect(card.getByText("Mumbai")).toBeVisible();
  await expect(card.getByText("INR 45,000+")).toBeVisible();
  await expect(card.getByText("Wedding Creator")).toBeVisible();
  await expect(card.getByText("Verified")).toBeVisible();

  // Cards link through to the public profile.
  await card.getByRole("link").first().click();
  await page.waitForURL("**/creators/**");
  await expect(page.getByRole("heading", { name: "Asha Rao" })).toBeVisible();
});

test("discover filters narrow the results", async ({ page }) => {
  await page.goto("/discover");

  await page.getByRole("button", { name: "Drone operator" }).click();
  await expect(page).toHaveURL(/types=drone_operator/);
  await expect(page.getByText("Rahul Desai")).toBeVisible();
  await expect(page.getByText("Asha Rao")).toHaveCount(0);

  await page.getByRole("link", { name: "Clear all filters" }).click();
  await expect(page.getByText("Asha Rao")).toBeVisible();
});

test("shots is a visual feed", async ({ page }) => {
  await page.goto("/shots");

  await expect(page.getByRole("heading", { name: "Shots", exact: true })).toBeVisible();
  // Media dominates: the feed is a wall of images with creator attribution, not text rows.
  await expect(page.getByRole("link", { name: "Kabir Singh" }).first()).toBeVisible();
  await expect(page.locator("figure img").first()).toBeVisible();
  expect(await page.locator("figure img").count()).toBeGreaterThan(8);
});

test("creators directory lists the marketplace", async ({ page }) => {
  await page.goto("/creators");

  await expect(page.getByRole("heading", { name: "Creators", exact: true })).toBeVisible();
  await expect(page.getByText("Asha Rao")).toBeVisible();
  await expect(page.getByText("Vikram Shah")).toBeVisible();
});

test("public navigation exposes the marketplace, not the studio", async ({ page }) => {
  await page.goto("/");

  const nav = page.locator("header nav").first();
  await expect(nav.getByRole("link", { name: "Discover" })).toBeVisible();
  await expect(nav.getByRole("link", { name: "Shots" })).toBeVisible();
  await expect(nav.getByRole("link", { name: "Gigs" })).toBeVisible();
  await expect(nav.getByRole("link", { name: "Creators" })).toBeVisible();
  await expect(nav.getByRole("link", { name: "Studio" })).toHaveCount(0);
});

test("a creator signing in lands on the marketplace home with Studio available", async ({
  page,
}) => {
  await login(page, "asha@example.dev");

  await expect(page.getByRole("heading", { name: "Welcome back, Asha" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Studio", exact: true })).toBeVisible();
  // Recommended creators, shots and gigs are all on the first screen.
  await expect(page.getByRole("heading", { name: "Recommended creators" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Fresh shots" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Gigs worth a look" })).toBeVisible();
  // A creator with a profile is not nagged to create one.
  await expect(page.getByRole("link", { name: "Create your creator profile" })).toHaveCount(0);
});
