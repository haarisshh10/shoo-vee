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

  user: {
    additionalFields: {
      role: {
        type: "text",
        defaultValue: "user",
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
