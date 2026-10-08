import "@tanstack/react-start/server-only";
import { drizzleAdapter } from "@better-auth/drizzle-adapter/relations-v2";
import { betterAuth } from "better-auth/minimal";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { ENV } from "varlock/env";

import { db } from "#/lib/db/index.ts";
import * as schema from "#/lib/db/schema/index.ts";

export const auth = betterAuth({
  baseURL: ENV.VITE_BASE_URL,
  trustedOrigins: [ENV.VITE_BASE_URL, "http://localhost:*", "http://127.0.0.1:*"],
  telemetry: {
    enabled: false,
  },
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),

  // https://better-auth.com/docs/integrations/tanstack#usage-tips
  plugins: [tanstackStartCookies()],

  // https://better-auth.com/docs/concepts/session-management#session-caching
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes
    },
  },

  // https://better-auth.com/docs/concepts/oauth
  socialProviders: {
    github: {
      clientId: ENV.GITHUB_CLIENT_ID!,
      clientSecret: ENV.GITHUB_CLIENT_SECRET!,
    },
    google: {
      clientId: ENV.GOOGLE_CLIENT_ID!,
      clientSecret: ENV.GOOGLE_CLIENT_SECRET!,
    },
  },

  // https://better-auth.com/docs/authentication/email-password
  emailAndPassword: {
    enabled: true,
  },

  // https://better-auth.com/docs/concepts/rate-limit
  // Only active in production by default, and the built-in sign-in rule (3 per 10s) trips easily
  // behind a shared IP. Widened here so brute force stays expensive without locking out a
  // household, an office on one connection, or a test run where every client shares one bucket.
  rateLimit: {
    enabled: true,
    window: 60,
    max: 100,
    customRules: {
      "/sign-in/*": { window: 60, max: 40 },
      "/sign-up/*": { window: 60, max: 10 },
    },
  },

  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "user",
        input: false,
      },

      // Onboarding interests. These are preferences, not roles: one account can hold any
      // combination, and Creator Profile activation is decided by the presence of a
      // `creator_profile` row rather than by a flag here.
      hireCreators: {
        type: "boolean",
        defaultValue: false,
        input: false,
      },
      showcaseWork: {
        type: "boolean",
        defaultValue: false,
        input: false,
      },
      findGigs: {
        type: "boolean",
        defaultValue: false,
        input: false,
      },
      // Null until onboarding is answered, which is what distinguishes "not asked yet" from
      // "asked and picked nothing".
      preferencesSetAt: {
        type: "date",
        required: false,
        input: false,
      },
    },
  },

  advanced: {
    database: {
      // https://better-auth.com/docs/adapters/drizzle#joins
      joins: true,
    },
  },
});
