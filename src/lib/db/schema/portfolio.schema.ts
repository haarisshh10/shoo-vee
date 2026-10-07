import { index, pgTable, text, timestamp } from "drizzle-orm/pg-core";

import { creatorProfile } from "./creator.schema";
import type { MediaType, PortfolioCategory } from "./types";

export const portfolioItem = pgTable(
  "portfolio_item",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    creatorId: text("creator_id")
      .notNull()
      .references(() => creatorProfile.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    mediaUrl: text("media_url").notNull(),
    mediaType: text("media_type").$type<MediaType>().notNull(),
    category: text("category").$type<PortfolioCategory>().notNull(),
    tags: text("tags").array().notNull().default([]),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("portfolio_item_creatorId_idx").on(table.creatorId),
    index("portfolio_item_category_idx").on(table.category),
    index("portfolio_item_createdAt_idx").on(table.createdAt),
  ],
);
