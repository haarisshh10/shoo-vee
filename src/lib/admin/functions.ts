import { createServerFn } from "@tanstack/react-start";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";

import { freshAuthMiddleware } from "#/lib/auth/middleware.ts";
import { db } from "#/lib/db/index.ts";
import { creatorProfile, gig, post, user } from "#/lib/db/schema/index.ts";

async function requireAdmin(userId: string) {
  const [row] = await db.select().from(user).where(eq(user.id, userId)).limit(1);
  if (!row || row.role !== "admin") {
    throw new Error("Not authorized.");
  }
  return row;
}

export const $adminListCreators = createServerFn({ method: "GET" })
  .middleware([freshAuthMiddleware])
  .handler(async ({ context }) => {
    await requireAdmin(context.user.id);
    return db
      .select({ profile: creatorProfile, owner: user })
      .from(creatorProfile)
      .innerJoin(user, eq(creatorProfile.userId, user.id))
      .orderBy(desc(creatorProfile.createdAt))
      .limit(100);
  });

export const $adminSetCreatorVerification = createServerFn({ method: "POST" })
  .middleware([freshAuthMiddleware])
  .validator((data) =>
    z
      .object({
        creatorId: z.string(),
        status: z.enum(["verified", "unverified", "rejected", "pending"]),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    await requireAdmin(context.user.id);
    const [updated] = await db
      .update(creatorProfile)
      .set({ verificationStatus: data.status })
      .where(eq(creatorProfile.id, data.creatorId))
      .returning();
    return updated;
  });

export const $adminListPosts = createServerFn({ method: "GET" })
  .middleware([freshAuthMiddleware])
  .handler(async ({ context }) => {
    await requireAdmin(context.user.id);
    return db.select().from(post).orderBy(desc(post.createdAt)).limit(100);
  });

export const $adminRemovePost = createServerFn({ method: "POST" })
  .middleware([freshAuthMiddleware])
  .validator((data) => z.object({ postId: z.string() }).parse(data))
  .handler(async ({ data, context }) => {
    await requireAdmin(context.user.id);
    await db.delete(post).where(eq(post.id, data.postId));
    return { removed: true };
  });

export const $adminListGigs = createServerFn({ method: "GET" })
  .middleware([freshAuthMiddleware])
  .handler(async ({ context }) => {
    await requireAdmin(context.user.id);
    return db.select().from(gig).orderBy(desc(gig.createdAt)).limit(100);
  });

export const $adminCloseGig = createServerFn({ method: "POST" })
  .middleware([freshAuthMiddleware])
  .validator((data) => z.object({ gigId: z.string() }).parse(data))
  .handler(async ({ data, context }) => {
    await requireAdmin(context.user.id);
    const [updated] = await db
      .update(gig)
      .set({ status: "closed" })
      .where(eq(gig.id, data.gigId))
      .returning();
    return updated;
  });
