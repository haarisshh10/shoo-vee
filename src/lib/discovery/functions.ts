import { createServerFn, createServerOnlyFn } from "@tanstack/react-start";
import { and, arrayContains, arrayOverlaps, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";
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
  specialty: z.string().trim().max(60).default(""),
  minRating: z.number().min(0).max(5).optional(),
  limit: z.number().int().min(1).max(50).default(12),
  sort: z
    .enum(["recommended", "rating", "price_low", "price_high", "newest"])
    .default("recommended"),
});

export type CreatorSearch = z.infer<typeof searchSchema>;

/**
 * Curated rows for the landing page and the signed-in home. The same shape as a discovery result,
 * so one card component covers every surface.
 */
export type CreatorCard = Awaited<ReturnType<typeof buildCreatorCards>>[number];

/** Shared enrichment for creator cards. Pass `creatorIds` to keep a known set (e.g. shortlists). */
export const buildCreatorCards = createServerOnlyFn(
  async (options: { limit?: number; creatorIds?: string[] } = {}) => {
    const { limit = 24, creatorIds } = options;
    const creators = await db
      .select()
      .from(creatorProfile)
      .where(creatorIds ? inArray(creatorProfile.id, creatorIds) : undefined)
      .orderBy(desc(creatorProfile.createdAt))
      .limit(limit);

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

    // Latest images per creator double as the card preview and the portfolio strip.
    const previews = await db
      .select({
        creatorId: portfolioItem.creatorId,
        mediaUrl: portfolioItem.mediaUrl,
        title: portfolioItem.title,
        createdAt: portfolioItem.createdAt,
      })
      .from(portfolioItem)
      .where(and(inArray(portfolioItem.creatorId, ids), eq(portfolioItem.mediaType, "image")))
      .orderBy(desc(portfolioItem.createdAt));

    const ratingMap = new Map(ratings.map((r) => [r.creatorId, r]));
    const previewsByCreator = new Map<string, { mediaUrl: string; title: string }[]>();
    for (const p of previews) {
      const list = previewsByCreator.get(p.creatorId);
      if (list) list.push({ mediaUrl: p.mediaUrl, title: p.title });
      else previewsByCreator.set(p.creatorId, [{ mediaUrl: p.mediaUrl, title: p.title }]);
    }

    return creators.map((c) => {
      const portfolio = previewsByCreator.get(c.id) ?? [];
      return {
        ...c,
        avgRating: ratingMap.get(c.id)?.avg ?? null,
        reviewCount: ratingMap.get(c.id)?.count ?? 0,
        previewImage: portfolio[0]?.mediaUrl ?? null,
        previewImages: portfolio.slice(0, 3).map((p) => p.mediaUrl),
      };
    });
  },
);

/**
 * Featured creators for the landing page and signed-in home. Verified work leads, then rating, so
 * the first impression is the strongest work on the platform.
 */
export const $getFeaturedCreators = createServerFn({ method: "GET" })
  .validator((data) =>
    z.object({ limit: z.number().int().min(1).max(24).default(8) }).parse(data ?? {}),
  )
  .handler(async ({ data }) => {
    const cards = await buildCreatorCards({ limit: data.limit * 3 });
    cards.sort((a, b) => {
      const score = (c: (typeof cards)[number]) =>
        (c.verificationStatus === "verified" ? 1000 : 0) + (c.avgRating ?? 0) * 100;
      return score(b) - score(a);
    });
    return cards.slice(0, data.limit);
  });

export type PopularCategory = Awaited<ReturnType<typeof countCreatorTypes>>[number];

const countCreatorTypes = createServerOnlyFn(async () => {
  const rows = await db
    .select({
      creatorType: sql<string>`unnest(${creatorProfile.creatorTypes})`,
      creators: sql<number>`count(*)::int`,
    })
    .from(creatorProfile)
    .groupBy(sql`unnest(${creatorProfile.creatorTypes})`);

  return rows
    .map((r) => ({
      slug: r.creatorType,
      label: r.creatorType.replaceAll("_", " "),
      creators: r.creators,
    }))
    .sort((a, b) => b.creators - a.creators);
});

export const $getPopularCategories = createServerFn({ method: "GET" }).handler(
  async () => await countCreatorTypes(),
);

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
    if (data.specialty) {
      conditions.push(arrayContains(creatorProfile.specialties, [data.specialty]));
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
      .limit(data.limit);

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

    const filtered =
      data.minRating !== undefined
        ? enriched.filter((c) => c.avgRating !== null && c.avgRating >= data.minRating!)
        : enriched;

    filtered.sort((a, b) => {
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

    return filtered;
  });
