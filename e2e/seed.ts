import type { APIRequestContext, Page } from "@playwright/test";
import postgres from "postgres";

/**
 * Signs in as (or creates) the demo admin account and asks the app to seed itself.
 *
 * The demo account is created through the public signup API and then promoted with SQL, which is
 * the only way to obtain the first admin — worth exercising here, since `/admin` is unreachable
 * without it. The seed endpoint itself requires an authenticated admin session.
 */

export const DEMO_EMAIL = "demo@sho-vee.dev";
export const DEMO_PASSWORD = "Demo1234!";

export async function seedE2eDatabase(request: APIRequestContext) {
  await signInOrCreateDemoUser(request);
  await promoteToAdmin(DEMO_EMAIL);

  const response = await request.post("/api/seed");
  if (!response.ok()) {
    throw new Error(`Seeding failed (${response.status()}): ${await response.text()}`);
  }
  return await response.json();
}

async function signInOrCreateDemoUser(request: APIRequestContext) {
  const credentials = { email: DEMO_EMAIL, password: DEMO_PASSWORD };
  const signIn = await request.post("/api/auth/sign-in/email", { data: credentials });
  if (signIn.ok()) return;

  const signUp = await request.post("/api/auth/sign-up/email", {
    data: { name: "Demo User", ...credentials },
  });
  if (signUp.ok()) return;

  // Better Auth answers 401 for both an unknown email and a wrong password, so report both
  // attempts: a tripped rate limit otherwise surfaces as a misleading signup error.
  throw new Error(
    `Could not provision the demo account — sign-in ${signIn.status()}: ${await signIn.text()} | sign-up ${signUp.status()}: ${await signUp.text()}`,
  );
}

async function promoteToAdmin(email: string) {
  const url =
    process.env.DATABASE_URL ?? "postgresql://postgres:password@localhost:5432/sho_vee_e2e";
  const sql = postgres(url, { max: 1 });
  try {
    await sql`UPDATE "user" SET role = 'admin' WHERE email = ${email}`;
  } finally {
    await sql.end();
  }
}

/** Signs a user in through the UI, replacing whoever the context was signed in as. */
export async function login(page: Page, email: string) {
  await page.context().clearCookies();
  // Wait for the client bundle, otherwise the click lands before React attaches the submit handler.
  await page.goto("/login", { waitUntil: "networkidle" });
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(DEMO_PASSWORD);
  await page.getByRole("button", { name: "Log in" }).click();
  await page.waitForURL("**/app");
}
