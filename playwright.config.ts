import { randomBytes } from "node:crypto";

import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;
const baseURL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  outputDir: ".cache/playwright",
  // The suite shares one seeded database, so specs must not run concurrently against it.
  workers: 1,
  fullyParallel: false,
  use: {
    baseURL,
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    // `e2e:prepare` resets and migrates the throwaway database before the production build runs.
    command: "vp run e2e:prepare && vp run build && vp run start:e2e",
    env: {
      NODE_ENV: "production",
      PORT: String(PORT),
      VITE_BASE_URL: baseURL,
      // Required by the seed endpoint, which is admin-only. Never set this in a real deployment.
      ALLOW_SEED: "true",
      // Zero-config fallback for the starter E2E test.
      // Once the project manages E2E secrets through `.env.e2e` or CI,
      // remove these entries and provide the required variables there instead.
      BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET ?? randomBytes(32).toString("base64url"),
      DATABASE_URL:
        process.env.DATABASE_URL ?? "postgresql://postgres:password@localhost:5432/sho_vee_e2e",
    },
    url: baseURL,
    reuseExistingServer: false,
    gracefulShutdown: { signal: "SIGTERM", timeout: 500 },
    timeout: 120_000,
  },
});
