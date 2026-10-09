import { expect, test } from "@playwright/test";

import { login, seedE2eDatabase } from "./seed";

test.beforeAll(async ({ request }) => {
  await seedE2eDatabase(request);
});

test("a customer can save a creator and find them under shortlists", async ({ page }) => {
  await login(page, "demo@sho-vee.dev");
  await page.goto("/discover");

  const card = page.getByRole("listitem").filter({ hasText: "Asha Rao" });
  await card.getByRole("button", { name: "Save", exact: true }).click();
  await expect(card.getByRole("button", { name: "Saved", exact: true })).toBeVisible();

  await page.goto("/app/shortlists");
  await expect(page.getByRole("heading", { name: "Shortlists" })).toBeVisible();
  await expect(page.getByText("Asha Rao")).toBeVisible();
});

test("a customer can follow a creator and see their work on the Following tab", async ({
  page,
}) => {
  await login(page, "demo@sho-vee.dev");

  await page.goto("/creators/asha-rao");
  await page.getByRole("button", { name: "Follow", exact: true }).click();
  await expect(page.getByRole("button", { name: "Following", exact: true })).toBeVisible();

  await page.goto("/shots");
  await page.getByRole("tab", { name: "following" }).click();
  await expect(page.getByText("Asha Rao").first()).toBeVisible();
});
