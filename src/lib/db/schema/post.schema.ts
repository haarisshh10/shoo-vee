import { index, pgTable, text, timestamp } from "drizzle-orm/pg-core";

import { creatorProfile } from "./creator.schema";
import type { MediaType } from "./types";

export const post = pgTable(
  "post",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    creatorId: text("creator_id")
      .notNull()
      .references(() => creatorProfile.id, { onDelete: "cascade" }),
    caption: text("caption"),
    mediaUrl: text("media_url").notNull(),
    mediaType: text("media_type").$type<MediaType>().notNull(),
    location: text("location"),
    tags: text("tags").array().notNull().default([]),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("post_creatorId_idx").on(table.creatorId),
    index("post_createdAt_idx").on(table.createdAt),
  ],
);
