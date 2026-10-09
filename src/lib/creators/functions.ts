import { createServerFn } from "@tanstack/react-start";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";

import { freshAuthMiddleware } from "#/lib/auth/middleware.ts";
import { generateUniqueSlug } from "#/lib/creators/slugs.ts";
import { db } from "#/lib/db/index.ts";
import {
  creatorEquipment,
  creatorProfile,
  equipment,
  portfolioItem,
  review,
  service,
  user,
} from "#/lib/db/schema/index.ts";
import { httpUrl, optionalMediaUrl } from "#/lib/uploads/schema.ts";

const creatorTypes = [
  "photographer",
  "videographer",
  "editor",
  "drone_operator",
  "product_creator",
  "wedding_creator",
  "event_creator",
  "content_creator",
  "other",
] as const;

export const createProfileSchema = z.object({
  displayName: z.string().trim().min(1).max(100),
  bio: z.string().trim().max(2000).optional(),
  profileImageUrl: optionalMediaUrl,
  coverImageUrl: optionalMediaUrl,
  location: z.string().trim().max(120).optional(),
  city: z.string().trim().max(120).optional(),
  neighborhood: z.string().trim().max(120).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  specialties: z.array(z.string().trim().min(1).max(50)).max(20).default([]),
  creatorTypes: z.array(z.enum(creatorTypes)).max(creatorTypes.length).default([]),
  startingPrice: z.number().int().min(0).max(100_000_000).optional(),
  currency: z.string().trim().length(3).default("INR"),
  experienceYears: z.number().int().min(0).max(80).optional(),
  socialLinks: z.record(z.string(), httpUrl).optional(),
  languages: z.array(z.string().trim().min(1).max(50)).max(20).default([]),
  availabilityStatus: z.enum(["available", "busy", "unavailable"]).default("available"),
});

export const $getCreatorById = createServerFn({ method: "GET" })
  .validator((data) => z.object({ creatorId: z.string() }).parse(data))
  .handler(async ({ data }) => {
    const [profile] = await db
      .select()
      .from(creatorProfile)
      .where(eq(creatorProfile.id, data.creatorId))
      .limit(1);
    if (!profile) return null;
    return loadCreatorDetail(profile);
  });

/** Resolves a friendly slug, falling back to the raw id so old links keep working. */
export const $getCreatorBySlug = createServerFn({ method: "GET" })
  .validator((data) => z.object({ slug: z.string() }).parse(data))
  .handler(async ({ data }) => {
    const [profile] = await db
      .select()
      .from(creatorProfile)
      .where(eq(creatorProfile.slug, data.slug))
      .limit(1);
    if (profile) return loadCreatorDetail(profile);

    const [byId] = await db
      .select()
      .from(creatorProfile)
      .where(eq(creatorProfile.id, data.slug))
      .limit(1);
    if (!byId) return null;
    return loadCreatorDetail(byId);
  });

async function loadCreatorDetail(profile: typeof creatorProfile.$inferSelect) {
  const [portfolioItems, services, equipmentRows, reviews] = await Promise.all([
    db
      .select()
      .from(portfolioItem)
      .where(eq(portfolioItem.creatorId, profile.id))
      .orderBy(desc(portfolioItem.createdAt)),
    db
      .select()
      .from(service)
      .where(eq(service.creatorId, profile.id))
      .orderBy(desc(service.createdAt)),
    db
      .select({ equipment })
      .from(creatorEquipment)
      .innerJoin(equipment, eq(creatorEquipment.equipmentId, equipment.id))
      .where(eq(creatorEquipment.creatorId, profile.id)),
    db
      .select({ review, reviewerName: user.name })
      .from(review)
      .innerJoin(user, eq(review.reviewerId, user.id))
      .where(eq(review.creatorId, profile.id))
      .orderBy(desc(review.createdAt)),
  ]);

  return { profile, portfolioItems, services, equipment: equipmentRows, reviews };
}

export type CreatorProfileInput = z.infer<typeof createProfileSchema>;

export const $getMyCreatorProfile = createServerFn({ method: "GET" })
  .middleware([freshAuthMiddleware])
  .handler(async ({ context }) => {
    const profile = await db.query.creatorProfile.findFirst({
      where: { userId: context.user.id },
    });
    return profile ?? null;
  });

export const $upsertCreatorProfile = createServerFn({ method: "POST" })
  .middleware([freshAuthMiddleware])
  .validator((data) => createProfileSchema.parse(data))
  .handler(async ({ data, context }) => {
    const values = {
      displayName: data.displayName,
      bio: data.bio || null,
      profileImageUrl: data.profileImageUrl || null,
      coverImageUrl: data.coverImageUrl || null,
      location: data.location || null,
      city: data.city || null,
      neighborhood: data.neighborhood || null,
      latitude: data.latitude ?? null,
      longitude: data.longitude ?? null,
      specialties: data.specialties,
      creatorTypes: data.creatorTypes,
      startingPrice: data.startingPrice ?? null,
      currency: data.currency,
      experienceYears: data.experienceYears ?? null,
      socialLinks: data.socialLinks ?? null,
      languages: data.languages,
      availabilityStatus: data.availabilityStatus,
    };

    const existing = await db.query.creatorProfile.findFirst({
      where: { userId: context.user.id },
    });

    if (existing) {
      const [updated] = await db
        .update(creatorProfile)
        .set({
          ...values,
          slug: existing.slug ?? (await generateUniqueSlug(data.displayName, existing.id)),
        })
        .where(eq(creatorProfile.userId, context.user.id))
        .returning();
      return updated;
    }

    const [created] = await db
      .insert(creatorProfile)
      .values({
        ...values,
        userId: context.user.id,
        slug: await generateUniqueSlug(data.displayName),
      })
      .returning();
    return created;
  });
