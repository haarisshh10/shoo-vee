import { index, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

import { creatorProfile } from "./creator.schema";
import type { PortfolioCategory, PricingUnit } from "./types";

export const service = pgTable(
  "service",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    creatorId: text("creator_id")
      .notNull()
      .references(() => creatorProfile.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    category: text("category").$type<PortfolioCategory>().notNull(),
    description: text("description"),
    price: integer("price").notNull(),
    currency: text("currency").notNull().default("INR"),
    pricingUnit: text("pricing_unit").$type<PricingUnit>().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("service_creatorId_idx").on(table.creatorId),
    index("service_category_idx").on(table.category),
    index("service_createdAt_idx").on(table.createdAt),
  ],
);
