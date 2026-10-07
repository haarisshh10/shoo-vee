import { expect, test } from "@playwright/test";

test.beforeAll(async ({ request }) => {
  await request.post("/api/seed");
});

test("landing page shows the brand message", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Create. Capture. Sell." })).toBeVisible();
  await expect(page.getByRole("button", { name: "Discover creators" })).toBeVisible();
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

test("login as seeded creator lands on the dashboard", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("asha@example.dev");
  await page.getByLabel("Password").fill("Demo1234!");
  await page.getByRole("button", { name: "Log in" }).click();
  await page.waitForURL("**/app");
  await expect(page.getByText("Hello, Asha Rao")).toBeVisible();
});

test("shots page renders seeded posts", async ({ page }) => {
  await page.goto("/shots");
  await expect(page.getByText("Latest work").first()).toBeVisible();
});
