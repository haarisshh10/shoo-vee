import { createServerFn } from "@tanstack/react-start";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";

import { freshAuthMiddleware } from "#/lib/auth/middleware.ts";
import { db } from "#/lib/db/index.ts";
import { creatorProfile, service } from "#/lib/db/schema/index.ts";

const serviceSchema = z.object({
  title: z.string().trim().min(1).max(120),
  category: z.enum([
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
  ]),
  description: z.string().trim().max(2000).optional(),
  price: z.number().int().min(0).max(100_000_000),
  currency: z.string().trim().length(3).default("INR"),
  pricingUnit: z.enum(["hour", "day", "project", "package"]),
});

export type ServiceInput = z.infer<typeof serviceSchema>;

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

export const $getMyServices = createServerFn({ method: "GET" })
  .middleware([freshAuthMiddleware])
  .handler(async ({ context }) => {
    const profile = await requireProfile(context.user.id);
    return db
      .select()
      .from(service)
      .where(eq(service.creatorId, profile.id))
      .orderBy(desc(service.createdAt));
  });

export const $getServicesByCreatorId = createServerFn({ method: "GET" })
  .validator((data) => z.object({ creatorId: z.string() }).parse(data))
  .handler(async ({ data }) => {
    return db
      .select()
      .from(service)
      .where(eq(service.creatorId, data.creatorId))
      .orderBy(desc(service.createdAt));
  });

export const $createService = createServerFn({ method: "POST" })
  .middleware([freshAuthMiddleware])
  .validator((data) => serviceSchema.parse(data))
  .handler(async ({ data, context }) => {
    const profile = await requireProfile(context.user.id);
    const [created] = await db
      .insert(service)
      .values({ ...data, creatorId: profile.id })
      .returning();
    return created;
  });

export const $deleteService = createServerFn({ method: "POST" })
  .middleware([freshAuthMiddleware])
  .validator((data) => z.object({ id: z.string() }).parse(data))
  .handler(async ({ data, context }) => {
    const profile = await requireProfile(context.user.id);
    const [deleted] = await db
      .delete(service)
      .where(and(eq(service.id, data.id), eq(service.creatorId, profile.id)))
      .returning();
    if (!deleted) {
      throw new Error("Service not found.");
    }
    return deleted;
  });
