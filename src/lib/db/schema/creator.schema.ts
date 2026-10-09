import { index, integer, jsonb, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

import { user } from "./auth.schema";
import type { AvailabilityStatus, CreatorType, VerificationStatus } from "./types";

export const creatorProfile = pgTable(
  "creator_profile",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    displayName: text("display_name").notNull(),
    slug: text("slug"),
    bio: text("bio"),
    profileImageUrl: text("profile_image_url"),
    coverImageUrl: text("cover_image_url"),
    location: text("location"),
    specialties: text("specialties").array().notNull().default([]),
    creatorTypes: text("creator_types").array().$type<CreatorType>().notNull().default([]),
    startingPrice: integer("starting_price"),
    currency: text("currency").notNull().default("INR"),
    verificationStatus: text("verification_status")
      .$type<VerificationStatus>()
      .notNull()
      .default("unverified"),
    experienceYears: integer("experience_years"),
    socialLinks: jsonb("social_links").$type<Record<string, string>>(),
    languages: text("languages").array().notNull().default([]),
    availabilityStatus: text("availability_status")
      .$type<AvailabilityStatus>()
      .notNull()
      .default("available"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("creator_profile_userId_idx").on(table.userId),
    uniqueIndex("creator_profile_slug_idx").on(table.slug),
    index("creator_profile_location_idx").on(table.location),
    index("creator_profile_verificationStatus_idx").on(table.verificationStatus),
    index("creator_profile_createdAt_idx").on(table.createdAt),
  ],
);
