import { expect, test } from "@playwright/test";

import { seedE2eDatabase } from "./seed";

test.beforeAll(async ({ request }) => {
  await seedE2eDatabase(request);
});

test("a new account answers one intent question before the marketplace", async ({ page }) => {
  await page.goto("/signup", { waitUntil: "networkidle" });
  await page.getByLabel("Name").fill("Nikhil Rao");
  await page.getByLabel("Email").fill("nikhil@example.dev");
  await page.getByLabel("Password", { exact: true }).fill("Demo1234!");
  await page.getByLabel("Confirm Password").fill("Demo1234!");
  await page.getByRole("button", { name: "Sign up" }).click();

  await page.waitForURL("**/app/onboarding", { timeout: 20_000 });
  await expect(page.getByRole("heading", { name: "What brings you to Sho-vee?" })).toBeVisible();

  // Interests are independent, not a role picker: picking two at once must be allowed.
  await page.getByRole("button", { name: /Hire creators/ }).click();
  await page.getByRole("button", { name: /Showcase my work/ }).click();
  await expect(page.getByRole("button", { name: /Hire creators/ })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(page.getByRole("button", { name: /Find gigs/ })).toHaveAttribute(
    "aria-pressed",
    "false",
  );

  await page.getByRole("button", { name: "Continue" }).click();
  await page.waitForURL("**/app", { timeout: 20_000 });

  await expect(page.getByRole("heading", { name: "Welcome back, Nikhil" })).toBeVisible();
  // "Showcase my work" was selected, so activation is called out prominently.
  await expect(page.getByText("You picked “Showcase my work”")).toBeVisible();
});

test("someone who only hires is not pushed to become a creator", async ({ page }) => {
  await page.goto("/signup", { waitUntil: "networkidle" });
  await page.getByLabel("Name").fill("Farah Qureshi");
  await page.getByLabel("Email").fill("farah@example.dev");
  await page.getByLabel("Password", { exact: true }).fill("Demo1234!");
  await page.getByLabel("Confirm Password").fill("Demo1234!");
  await page.getByRole("button", { name: "Sign up" }).click();

  await page.waitForURL("**/app/onboarding", { timeout: 20_000 });
  await page.getByRole("button", { name: /Hire creators/ }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.waitForURL("**/app", { timeout: 20_000 });

  await expect(page.getByRole("heading", { name: "Welcome back, Farah" })).toBeVisible();
  await expect(page.getByText("You picked “Showcase my work”")).toHaveCount(0);
  // Activation is still available, just not the headline.
  await expect(page.getByRole("link", { name: "Create your creator profile" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Studio", exact: true })).toHaveCount(0);
});

test("creator activation unlocks Studio on the same account", async ({ page }) => {
  await page.goto("/login", { waitUntil: "networkidle" });
  await page.getByLabel("Email").fill("nikhil@example.dev");
  await page.getByLabel("Password", { exact: true }).fill("Demo1234!");
  await page.getByRole("button", { name: "Log in" }).click();
  await page.waitForURL("**/app", { timeout: 20_000 });

  // No profile yet, so Studio is absent and activation is one click away.
  await expect(page.getByRole("link", { name: "Studio", exact: true })).toHaveCount(0);
  await page.getByRole("link", { name: "Create your creator profile" }).first().click();
  await page.waitForURL("**/app/profile/creator");

  await page.getByLabel("Display name").fill("Nikhil Rao");
  await page.getByLabel("Location").fill("Bengaluru");
  // The chip is a real checkbox under a styled label, so it is visually covered by its own
  // label. Click the way a user does and assert the state rather than forcing the input.
  const videographer = page.getByRole("checkbox", { name: "Videographer" });
  await page.getByText("Videographer", { exact: true }).click();
  await expect(videographer).toBeChecked();
  await page.getByRole("button", { name: /Publish creator profile|Save changes/ }).click();

  await expect(page.getByText("Creator profile saved.")).toBeVisible();

  await page.goto("/app");
  await expect(page.getByRole("link", { name: "Studio", exact: true })).toBeVisible();

  await page.goto("/app/studio");
  await expect(page.getByRole("heading", { name: "Nikhil Rao" })).toBeVisible();
  // The marketplace surfaces still work for a creator.
  await expect(page.getByRole("link", { name: "Discover" })).toBeVisible();
});

test("messages is a placeholder rather than a broken link", async ({ page }) => {
  await page.goto("/login", { waitUntil: "networkidle" });
  await page.getByLabel("Email").fill("farah@example.dev");
  await page.getByLabel("Password", { exact: true }).fill("Demo1234!");
  await page.getByRole("button", { name: "Log in" }).click();
  await page.waitForURL("**/app", { timeout: 20_000 });

  await page.getByRole("link", { name: "Messages" }).click();
  await page.waitForURL("**/app/messages");
  await expect(page.getByRole("heading", { name: "Messages are not here yet" })).toBeVisible();
});
