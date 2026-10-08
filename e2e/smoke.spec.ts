import { expect, test } from "@playwright/test";

import { login, seedE2eDatabase } from "./seed";

test.beforeAll(async ({ request }) => {
  await seedE2eDatabase(request);
});

test("landing page shows the brand message", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Create. Capture. Sell." })).toBeVisible();
  await expect(page.getByRole("link", { name: "Discover creators" })).toBeVisible();
});

test("discover lists seeded creators", async ({ page }) => {
  await page.goto("/discover");
  await expect(page.getByText("Asha Rao")).toBeVisible();
  await expect(page.getByText("Vikram Shah")).toBeVisible();
});

test("gigs page lists seeded gigs", async ({ page }) => {
  await page.goto("/gigs");
  await expect(page.getByText("Need second photographer for a wedding")).toBeVisible();
});

test("login as seeded creator lands on the marketplace home", async ({ page }) => {
  await login(page, "asha@example.dev");
  await expect(page.getByRole("heading", { name: "Welcome back, Asha" })).toBeVisible();
});

test("shots page renders seeded posts", async ({ page }) => {
  await page.goto("/shots");
  await expect(page.getByText("recent posts")).toBeVisible();
});
