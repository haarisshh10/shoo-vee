import { createServerFn } from "@tanstack/react-start";
import { desc, eq, sql } from "drizzle-orm";
import { z } from "zod";

import { authMiddleware, freshAuthMiddleware } from "#/lib/auth/middleware.ts";
import { db } from "#/lib/db/index.ts";
import { creatorProfile, follow, post, savedCreator } from "#/lib/db/schema/index.ts";
import { buildCreatorCards } from "#/lib/discovery/functions.ts";

const byCreator = z.object({ creatorId: z.string().min(1) });

/** Public tallies shown next to the Save and Follow buttons. */
export const $getCreatorSocialCounts = createServerFn({ method: "GET" })
  .validator((data) => byCreator.parse(data))
  .handler(async ({ data }) => {
    const [saves, followers] = await Promise.all([
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(savedCreator)
        .where(eq(savedCreator.creatorId, data.creatorId)),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(follow)
        .where(eq(follow.creatorId, data.creatorId)),
    ]);
    return { saves: saves[0]?.count ?? 0, followers: followers[0]?.count ?? 0 };
  });

/** The current user's saved and followed creator ids, so card grids stay to a single request. */
export const $getMySocialIds = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const [saved, followed] = await Promise.all([
      db
        .select({ creatorId: savedCreator.creatorId })
        .from(savedCreator)
        .where(eq(savedCreator.userId, context.user.id)),
      db
        .select({ creatorId: follow.creatorId })
        .from(follow)
        .where(eq(follow.followerId, context.user.id)),
    ]);
    return {
      savedIds: saved.map((r) => r.creatorId),
      followingIds: followed.map((r) => r.creatorId),
    };
  });

export const $toggleSavedCreator = createServerFn({ method: "POST" })
  .middleware([freshAuthMiddleware])
  .validator((data) => byCreator.parse(data))
  .handler(async ({ data, context }) => {
    const existing = await db.query.savedCreator.findFirst({
      where: { userId: context.user.id, creatorId: data.creatorId },
    });
    if (existing) {
      await db.delete(savedCreator).where(eq(savedCreator.id, existing.id));
      return { saved: false };
    }
    await db.insert(savedCreator).values({ userId: context.user.id, creatorId: data.creatorId });
    return { saved: true };
  });

export const $toggleFollow = createServerFn({ method: "POST" })
  .middleware([freshAuthMiddleware])
  .validator((data) => byCreator.parse(data))
  .handler(async ({ data, context }) => {
    const existing = await db.query.follow.findFirst({
      where: { followerId: context.user.id, creatorId: data.creatorId },
    });
    if (existing) {
      await db.delete(follow).where(eq(follow.id, existing.id));
      return { following: false };
    }
    await db.insert(follow).values({ followerId: context.user.id, creatorId: data.creatorId });
    return { following: true };
  });

/** The user's shortlist, newest save first, enriched into the same shape as discovery cards. */
export const $getSavedCreators = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const rows = await db
      .select({ creatorId: savedCreator.creatorId, createdAt: savedCreator.createdAt })
      .from(savedCreator)
      .where(eq(savedCreator.userId, context.user.id))
      .orderBy(desc(savedCreator.createdAt));
    if (rows.length === 0) return [];

    const cards = await buildCreatorCards({ creatorIds: rows.map((r) => r.creatorId) });
    const order = new Map(rows.map((r, index) => [r.creatorId, index]));
    return [...cards].sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
  });

/** Posts from the creators this user follows — the Following tab on Shots. */
export const $getFollowingFeed = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((data) =>
    z.object({ limit: z.number().int().min(1).max(50).default(30) }).parse(data ?? {}),
  )
  .handler(async ({ data, context }) => {
    return db
      .select({ post, creator: creatorProfile })
      .from(follow)
      .innerJoin(creatorProfile, eq(follow.creatorId, creatorProfile.id))
      .innerJoin(post, eq(post.creatorId, creatorProfile.id))
      .where(eq(follow.followerId, context.user.id))
      .orderBy(desc(post.createdAt))
      .limit(data.limit);
  });
