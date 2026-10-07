import { createServerFn } from "@tanstack/react-start";
import { and, desc, eq, ilike } from "drizzle-orm";
import { z } from "zod";

import { freshAuthMiddleware } from "#/lib/auth/middleware.ts";
import { db } from "#/lib/db/index.ts";
import { creatorEquipment, creatorProfile, equipment } from "#/lib/db/schema/index.ts";

const equipmentCategories = [
  "camera",
  "lens",
  "lighting",
  "audio",
  "drone",
  "gimbal",
  "tripod",
  "accessory",
  "other",
] as const;

const equipmentSchema = z.object({
  name: z.string().trim().min(1).max(120),
  brand: z.string().trim().max(120).optional(),
  model: z.string().trim().max(120).optional(),
  category: z.enum(equipmentCategories),
});

export type EquipmentInput = z.infer<typeof equipmentSchema>;

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

export const $getMyEquipment = createServerFn({ method: "GET" })
  .middleware([freshAuthMiddleware])
  .handler(async ({ context }) => {
    const profile = await requireProfile(context.user.id);
    return db
      .select({ equipment })
      .from(creatorEquipment)
      .innerJoin(equipment, eq(creatorEquipment.equipmentId, equipment.id))
      .where(eq(creatorEquipment.creatorId, profile.id))
      .orderBy(desc(equipment.name));
  });

export const $getEquipmentByCreatorId = createServerFn({ method: "GET" })
  .validator((data) => z.object({ creatorId: z.string() }).parse(data))
  .handler(async ({ data }) => {
    return db
      .select({ equipment })
      .from(creatorEquipment)
      .innerJoin(equipment, eq(creatorEquipment.equipmentId, equipment.id))
      .where(eq(creatorEquipment.creatorId, data.creatorId))
      .orderBy(desc(equipment.name));
  });

export const $searchEquipment = createServerFn({ method: "GET" })
  .validator((data) => z.object({ query: z.string().trim().max(120).default("") }).parse(data))
  .handler(async ({ data }) => {
    if (!data.query) return [];
    return db
      .select()
      .from(equipment)
      .where(ilike(equipment.name, `%${data.query}%`))
      .limit(10);
  });

export const $addEquipment = createServerFn({ method: "POST" })
  .middleware([freshAuthMiddleware])
  .validator((data) => equipmentSchema.parse(data))
  .handler(async ({ data, context }) => {
    const profile = await requireProfile(context.user.id);

    const [found] = await db
      .select()
      .from(equipment)
      .where(
        and(
          eq(equipment.name, data.name),
          data.brand ? eq(equipment.brand, data.brand) : undefined,
          data.model ? eq(equipment.model, data.model) : undefined,
        ),
      )
      .limit(1);

    const record =
      found ??
      (
        await db
          .insert(equipment)
          .values({
            name: data.name,
            brand: data.brand ?? null,
            model: data.model ?? null,
            category: data.category,
          })
          .returning()
      )[0];

    await db
      .insert(creatorEquipment)
      .values({ creatorId: profile.id, equipmentId: record.id })
      .onConflictDoNothing();

    return record;
  });

export const $removeEquipment = createServerFn({ method: "POST" })
  .middleware([freshAuthMiddleware])
  .validator((data) => z.object({ equipmentId: z.string() }).parse(data))
  .handler(async ({ data, context }) => {
    const profile = await requireProfile(context.user.id);
    await db
      .delete(creatorEquipment)
      .where(
        and(
          eq(creatorEquipment.creatorId, profile.id),
          eq(creatorEquipment.equipmentId, data.equipmentId),
        ),
      );
    return { removed: true };
  });
