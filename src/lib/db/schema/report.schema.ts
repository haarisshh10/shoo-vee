import { index, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

import { user } from "./auth.schema";

export type ReportTargetType = "creator_profile" | "post" | "gig" | "booking";

export type ReportStatus = "open" | "reviewed" | "dismissed";

export const report = pgTable(
  "report",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    reporterId: text("reporter_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    targetType: text("target_type").$type<ReportTargetType>().notNull(),
    targetId: text("target_id").notNull(),
    reason: text("reason").notNull(),
    status: text("status").$type<ReportStatus>().notNull().default("open"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("report_status_idx").on(table.status),
    index("report_targetType_targetId_idx").on(table.targetType, table.targetId),
    uniqueIndex("report_reporterId_targetType_targetId_idx").on(
      table.reporterId,
      table.targetType,
      table.targetId,
    ),
  ],
);
