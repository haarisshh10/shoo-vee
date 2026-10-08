import { createServerFn } from "@tanstack/react-start";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";

import { freshAuthMiddleware } from "#/lib/auth/middleware.ts";
import { db } from "#/lib/db/index.ts";
import { creatorProfile, post } from "#/lib/db/schema/index.ts";
import { resolveReportsForRemovedTarget } from "#/lib/reports/functions.ts";

const postSchema = z.object({
  caption: z.string().trim().max(2000).optional(),
  mediaUrl: z.url(),
  mediaType: z.enum(["image", "video"]),
  location: z.string().trim().max(120).optional(),
  tags: z.array(z.string().trim().min(1).max(50)).max(10).default([]),
});

export type PostInput = z.infer<typeof postSchema>;

async function requireProfile(userId: string) {
  const [profile] = await db
    .select()
    .from(creatorProfile)
    .where(eq(creatorProfile.userId, userId))
    .limit(1);
  if (!profile) {
    throw new Error("Create your creator profile first.");
  }
  return profile;
}

export const $getFeed = createServerFn({ method: "GET" })
  .validator((data) =>
    z.object({ limit: z.number().int().min(1).max(50).default(30) }).parse(data ?? {}),
  )
  .handler(async ({ data }) => {
    return db
      .select({ post, creator: creatorProfile })
      .from(post)
      .innerJoin(creatorProfile, eq(post.creatorId, creatorProfile.id))
      .orderBy(desc(post.createdAt))
      .limit(data.limit);
  });

export const $getMyPosts = createServerFn({ method: "GET" })
  .middleware([freshAuthMiddleware])
  .handler(async ({ context }) => {
    const profile = await requireProfile(context.user.id);
    return db
      .select()
      .from(post)
      .where(eq(post.creatorId, profile.id))
      .orderBy(desc(post.createdAt));
  });

export const $createPost = createServerFn({ method: "POST" })
  .middleware([freshAuthMiddleware])
  .validator((data) => postSchema.parse(data))
  .handler(async ({ data, context }) => {
    const profile = await requireProfile(context.user.id);
    const [created] = await db
      .insert(post)
      .values({ ...data, creatorId: profile.id })
      .returning();
    return created;
  });

export const $deletePost = createServerFn({ method: "POST" })
  .middleware([freshAuthMiddleware])
  .validator((data) => z.object({ id: z.string() }).parse(data))
  .handler(async ({ data, context }) => {
    const profile = await requireProfile(context.user.id);
    const [deleted] = await db
      .delete(post)
      .where(and(eq(post.id, data.id), eq(post.creatorId, profile.id)))
      .returning();
    if (!deleted) throw new Error("Post not found.");
    await resolveReportsForRemovedTarget("post", deleted.id);
    return deleted;
  });
