import { createServerFn } from "@tanstack/react-start";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";

import { freshAuthMiddleware } from "#/lib/auth/middleware.ts";
import { db } from "#/lib/db/index.ts";
import { creatorProfile, portfolioItem } from "#/lib/db/schema/index.ts";

const portfolioCategories = [
  "wedding",
  "portrait",
  "fashion",
  "automotive",
  "product",
  "event",
  "travel",
  "food",
  "real_estate",
  "commercial",
  "social_media",
  "other",
] as const;

const portfolioItemSchema = z.object({
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().max(2000).optional(),
  mediaUrl: z.url(),
  mediaType: z.enum(["image", "video"]),
  category: z.enum(portfolioCategories),
  tags: z.array(z.string().trim().min(1).max(50)).max(10).default([]),
});

export type PortfolioItemInput = z.infer<typeof portfolioItemSchema>;

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

export const $getMyPortfolioItems = createServerFn({ method: "GET" })
  .middleware([freshAuthMiddleware])
  .handler(async ({ context }) => {
    const profile = await requireProfile(context.user.id);
    return db
      .select()
      .from(portfolioItem)
      .where(eq(portfolioItem.creatorId, profile.id))
      .orderBy(desc(portfolioItem.createdAt));
  });

export const $getPortfolioByCreatorId = createServerFn({ method: "GET" })
  .validator((data) => z.object({ creatorId: z.string() }).parse(data))
  .handler(async ({ data }) => {
    return db
      .select()
      .from(portfolioItem)
      .where(eq(portfolioItem.creatorId, data.creatorId))
      .orderBy(desc(portfolioItem.createdAt));
  });

export const $createPortfolioItem = createServerFn({ method: "POST" })
  .middleware([freshAuthMiddleware])
  .validator((data) => portfolioItemSchema.parse(data))
  .handler(async ({ data, context }) => {
    const profile = await requireProfile(context.user.id);
    const [created] = await db
      .insert(portfolioItem)
      .values({ ...data, creatorId: profile.id })
      .returning();
    return created;
  });

export const $deletePortfolioItem = createServerFn({ method: "POST" })
  .middleware([freshAuthMiddleware])
  .validator((data) => z.object({ id: z.string() }).parse(data))
  .handler(async ({ data, context }) => {
    const profile = await requireProfile(context.user.id);
    const [deleted] = await db
      .delete(portfolioItem)
      .where(and(eq(portfolioItem.id, data.id), eq(portfolioItem.creatorId, profile.id)))
      .returning();
    if (!deleted) {
      throw new Error("Portfolio item not found.");
    }
    return deleted;
  });
