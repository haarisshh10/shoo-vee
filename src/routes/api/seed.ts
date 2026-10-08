import { createFileRoute } from "@tanstack/react-router";
import { getRequest } from "@tanstack/react-start/server";
import { createError } from "evlog";
import { ENV } from "varlock/env";

import { auth } from "#/lib/auth/auth.ts";
import { seedDevelopmentData } from "#/lib/dev/seed.ts";
import { useLogger } from "#/lib/logger.server.ts";

/**
 * Development data seeder.
 *
 * Two independent gates apply, because every seeded account shares one published password:
 * `ALLOW_SEED` must be enabled for the environment, and the caller must hold an admin session.
 * The public origin is deliberately not part of the decision — `VITE_BASE_URL` is inlined into
 * the client bundle, so a staging or proxied deployment could otherwise satisfy a naive check.
 */
export const Route = createFileRoute("/api/seed")({
  server: {
    handlers: {
      POST: async () => {
        const log = useLogger();
        log.set({ action: "seed" });

        if (ENV.ALLOW_SEED !== true) {
          log.set({ seed: { outcome: "rejected", reason: "disabled" } });
          throw createError({
            message: "Seeding is disabled",
            status: 403,
            why: "ALLOW_SEED is not enabled for this environment",
            fix: "Set ALLOW_SEED=true in .env.local and sign in as an admin",
          });
        }

        const session = await auth.api.getSession({
          headers: getRequest().headers,
          // Never trust the cookie cache here: the flag above plus a stale admin session would
          // still let a recently demoted admin seed.
          query: { disableCookieCache: true },
        });
        if (session?.user.role !== "admin") {
          log.set({ seed: { outcome: "rejected", reason: "unauthorized" } });
          throw createError({
            message: "Not authorized",
            status: 403,
            why: "Seeding requires an admin session",
            fix: "Sign in with an account whose role is admin",
          });
        }

        log.set({
          user: { id: session.user.id },
          seed: {
            // Seeding in a production build means published credentials exist on a real origin.
            production: process.env.NODE_ENV === "production",
          },
        });

        const result = await seedDevelopmentData();
        log.set({ seed: { outcome: "completed", ...result } });
        return Response.json(result);
      },
    },
  },
});
