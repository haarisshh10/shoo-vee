import { index, integer, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

import { user } from "./auth.schema";
import type { GigApplicationStatus, GigStatus } from "./types";

export const gig = pgTable(
  "gig",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    posterId: text("poster_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    roleNeeded: text("role_needed").notNull(),
    location: text("location"),
    pay: integer("pay"),
    currency: text("currency").notNull().default("INR"),
    date: timestamp("date"),
    status: text("status").$type<GigStatus>().notNull().default("open"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("gig_posterId_idx").on(table.posterId),
    index("gig_status_idx").on(table.status),
    index("gig_createdAt_idx").on(table.createdAt),
  ],
);

export const gigApplication = pgTable(
  "gig_application",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    gigId: text("gig_id")
      .notNull()
      .references(() => gig.id, { onDelete: "cascade" }),
    applicantId: text("applicant_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    message: text("message"),
    status: text("status").$type<GigApplicationStatus>().notNull().default("pending"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("gig_application_gigId_applicantId_idx").on(table.gigId, table.applicantId),
    index("gig_application_applicantId_idx").on(table.applicantId),
    index("gig_application_status_idx").on(table.status),
  ],
);
