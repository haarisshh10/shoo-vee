import { index, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

import { user } from "./auth.schema";
import { creatorProfile } from "./creator.schema";

/** A creator a user kept for later. Private to the user; the creator is not notified. */
export const savedCreator = pgTable(
  "saved_creator",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    creatorId: text("creator_id")
      .notNull()
      .references(() => creatorProfile.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("saved_creator_userId_creatorId_idx").on(table.userId, table.creatorId),
    index("saved_creator_creatorId_idx").on(table.creatorId),
  ],
);

/** A user following a creator's public work, which powers the Following feed on Shots. */
export const follow = pgTable(
  "follow",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    followerId: text("follower_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    creatorId: text("creator_id")
      .notNull()
      .references(() => creatorProfile.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("follow_followerId_creatorId_idx").on(table.followerId, table.creatorId),
    index("follow_creatorId_idx").on(table.creatorId),
  ],
);
