import { createServerFn } from "@tanstack/react-start";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";

import { freshAuthMiddleware } from "#/lib/auth/middleware.ts";
import { db } from "#/lib/db/index.ts";
import { creatorProfile, gig, post, user } from "#/lib/db/schema/index.ts";
import { notify } from "#/lib/notifications/functions.ts";
import { resolveReportsForRemovedTarget } from "#/lib/reports/functions.ts";

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
    if (updated) {
      await notify(updated.userId, {
        type: "verification",
        title: `Verification ${data.status}`,
        body: `Your creator profile is now ${data.status}.`,
      });
    }
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
    const [removed] = await db.delete(post).where(eq(post.id, data.postId)).returning();
    if (!removed) throw new Error("Post not found.");
    const resolvedReports = await resolveReportsForRemovedTarget("post", removed.id);
    return { removed: true, resolvedReports };
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
    if (!updated) throw new Error("Gig not found.");
    const resolvedReports = await resolveReportsForRemovedTarget("gig", updated.id);
    return { ...updated, resolvedReports };
  });

export const $adminSetUserRole = createServerFn({ method: "POST" })
  .middleware([freshAuthMiddleware])
  .validator((data) =>
    z.object({ userId: z.string(), role: z.enum(["user", "admin"]) }).parse(data),
  )
  .handler(async ({ data, context }) => {
    await requireAdmin(context.user.id);
    // Self-demotion would lock the last admin out of the console with no other way back in.
    if (data.userId === context.user.id) {
      throw new Error("You cannot change your own role.");
    }
    const [updated] = await db
      .update(user)
      .set({ role: data.role })
      .where(eq(user.id, data.userId))
      .returning();
    if (!updated) throw new Error("User not found.");

    await notify(updated.id, {
      type: "system",
      title: data.role === "admin" ? "You are now an admin" : "Admin access removed",
      body:
        data.role === "admin"
          ? "You can now open the admin console."
          : "You can no longer open the admin console.",
    });
    return updated;
  });
