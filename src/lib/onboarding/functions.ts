import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { freshAuthMiddleware } from "#/lib/auth/middleware.ts";
import { db } from "#/lib/db/index.ts";
import { user } from "#/lib/db/schema/index.ts";

const interestsSchema = z.object({
  hireCreators: z.boolean(),
  showcaseWork: z.boolean(),
  findGigs: z.boolean(),
});

export const $getMyInterests = createServerFn({ method: "GET" })
  .middleware([freshAuthMiddleware])
  .handler(async ({ context }) => {
    const [row] = await db
      .select({
        hireCreators: user.hireCreators,
        showcaseWork: user.showcaseWork,
        findGigs: user.findGigs,
        preferencesSetAt: user.preferencesSetAt,
      })
      .from(user)
      .where(eq(user.id, context.user.id))
      .limit(1);

    if (!row) throw new Error("User not found.");
    return row;
  });

export const $saveMyInterests = createServerFn({ method: "POST" })
  .middleware([freshAuthMiddleware])
  .validator((data) => interestsSchema.parse(data))
  .handler(async ({ data, context }) => {
    const [updated] = await db
      .update(user)
      // Re-answering onboarding counts as answering it, so the timestamp is always refreshed.
      .set({ ...data, preferencesSetAt: new Date() })
      .where(eq(user.id, context.user.id))
      .returning({
        hireCreators: user.hireCreators,
        showcaseWork: user.showcaseWork,
        findGigs: user.findGigs,
        preferencesSetAt: user.preferencesSetAt,
      });

    if (!updated) throw new Error("User not found.");
    return updated;
  });
