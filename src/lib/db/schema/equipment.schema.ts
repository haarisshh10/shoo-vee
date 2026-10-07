import { index, pgTable, primaryKey, text } from "drizzle-orm/pg-core";

import { creatorProfile } from "./creator.schema";
import type { EquipmentCategory } from "./types";

export const equipment = pgTable(
  "equipment",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: text("name").notNull(),
    brand: text("brand"),
    model: text("model"),
    category: text("category").$type<EquipmentCategory>().notNull(),
  },
  (table) => [
    index("equipment_category_idx").on(table.category),
    index("equipment_name_idx").on(table.name),
  ],
);

export const creatorEquipment = pgTable(
  "creator_equipment",
  {
    creatorId: text("creator_id")
      .notNull()
      .references(() => creatorProfile.id, { onDelete: "cascade" }),
    equipmentId: text("equipment_id")
      .notNull()
      .references(() => equipment.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.creatorId, table.equipmentId] }),
    index("creator_equipment_equipmentId_idx").on(table.equipmentId),
  ],
);
