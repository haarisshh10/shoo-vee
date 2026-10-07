import { createServerFn } from "@tanstack/react-start";
import { and, arrayOverlaps, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import { z } from "zod";

import { db } from "#/lib/db/index.ts";
import {
  creatorEquipment,
  creatorProfile,
  equipment,
  portfolioItem,
  review,
} from "#/lib/db/schema/index.ts";
import type { CreatorType } from "#/lib/db/schema/types.ts";

export const searchSchema = z.object({
  query: z.string().trim().max(120).default(""),
  location: z.string().trim().max(120).default(""),
  creatorTypes: z.array(z.string()).default([]),
  maxPrice: z.number().int().min(0).optional(),
  verifiedOnly: z.boolean().default(false),
  equipment: z.string().trim().max(120).default(""),
  sort: z
    .enum(["recommended", "rating", "price_low", "price_high", "newest"])
    .default("recommended"),
});

export type CreatorSearch = z.infer<typeof searchSchema>;

export const $searchCreators = createServerFn({ method: "GET" })
  .validator((data) => searchSchema.parse(data))
  .handler(async ({ data }) => {
    const conditions = [];

    if (data.query) {
      conditions.push(
        or(
          ilike(creatorProfile.displayName, `%${data.query}%`),
          ilike(creatorProfile.bio, `%${data.query}%`),
        ),
      );
    }
    if (data.location) {
      conditions.push(ilike(creatorProfile.location, `%${data.location}%`));
    }
    if (data.creatorTypes.length > 0) {
      conditions.push(
        arrayOverlaps(creatorProfile.creatorTypes, data.creatorTypes as CreatorType[]),
      );
    }
    if (data.maxPrice !== undefined) {
      conditions.push(sql`${creatorProfile.startingPrice} <= ${data.maxPrice}`);
    }
    if (data.verifiedOnly) {
      conditions.push(eq(creatorProfile.verificationStatus, "verified"));
    }

    let creatorIds: string[] | undefined;
    if (data.equipment) {
      const rows = await db
        .select({ creatorId: creatorEquipment.creatorId })
        .from(creatorEquipment)
        .innerJoin(equipment, eq(creatorEquipment.equipmentId, equipment.id))
        .where(ilike(equipment.name, `%${data.equipment}%`));
      creatorIds = [...new Set(rows.map((r) => r.creatorId))];
      if (creatorIds.length === 0) return [];
    }

    if (creatorIds) {
      conditions.push(inArray(creatorProfile.id, creatorIds));
    }

    const creators = await db
      .select()
      .from(creatorProfile)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(creatorProfile.createdAt))
      .limit(50);

    if (creators.length === 0) return [];

    const ids = creators.map((c) => c.id);

    const ratings = await db
      .select({
        creatorId: review.creatorId,
        avg: sql<number>`avg(${review.rating})::float`,
        count: sql<number>`count(*)::int`,
      })
      .from(review)
      .where(inArray(review.creatorId, ids))
      .groupBy(review.creatorId);

    const previews = await db
      .select({ creatorId: portfolioItem.creatorId, mediaUrl: portfolioItem.mediaUrl })
      .from(portfolioItem)
      .where(and(inArray(portfolioItem.creatorId, ids), eq(portfolioItem.mediaType, "image")))
      .orderBy(desc(portfolioItem.createdAt));

    const ratingMap = new Map(ratings.map((r) => [r.creatorId, r]));
    const previewMap = new Map<string, string>();
    for (const p of previews) {
      if (!previewMap.has(p.creatorId)) previewMap.set(p.creatorId, p.mediaUrl);
    }

    const enriched = creators.map((c) => ({
      ...c,
      avgRating: ratingMap.get(c.id)?.avg ?? null,
      reviewCount: ratingMap.get(c.id)?.count ?? 0,
      previewImage: previewMap.get(c.id) ?? null,
    }));

    enriched.sort((a, b) => {
      switch (data.sort) {
        case "price_low":
          return (a.startingPrice ?? Infinity) - (b.startingPrice ?? Infinity);
        case "price_high":
          return (b.startingPrice ?? -Infinity) - (a.startingPrice ?? -Infinity);
        case "rating":
          return (b.avgRating ?? 0) - (a.avgRating ?? 0);
        case "newest":
          return b.createdAt.getTime() - a.createdAt.getTime();
        case "recommended":
        default: {
          const aScore = (a.verificationStatus === "verified" ? 100 : 0) + (a.avgRating ?? 0) * 10;
          const bScore = (b.verificationStatus === "verified" ? 100 : 0) + (b.avgRating ?? 0) * 10;
          return bScore - aScore;
        }
      }
    });

    return enriched;
  });
