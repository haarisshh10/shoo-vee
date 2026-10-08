import { sql } from "drizzle-orm";
import { index, integer, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

import { user } from "./auth.schema";
import { creatorProfile } from "./creator.schema";
import { service } from "./service.schema";
import type { BookingStatus } from "./types";

export const booking = pgTable(
  "booking",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    customerId: text("customer_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    creatorId: text("creator_id")
      .notNull()
      .references(() => creatorProfile.id, { onDelete: "cascade" }),
    serviceId: text("service_id").references(() => service.id, { onDelete: "set null" }),
    eventDate: timestamp("event_date"),
    location: text("location"),
    message: text("message"),
    agreedPrice: integer("agreed_price"),
    currency: text("currency").notNull().default("INR"),
    status: text("status").$type<BookingStatus>().notNull().default("pending"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("booking_customerId_idx").on(table.customerId),
    index("booking_creatorId_idx").on(table.creatorId),
    index("booking_status_idx").on(table.status),
    index("booking_createdAt_idx").on(table.createdAt),
    // The backstop against double-booking. A booking covers a whole calendar day, so a creator
    // cannot have two accepted bookings on the same day — and two accepts can race, so the
    // application check alone would not be enough. Undated requests are exempt: we cannot tell
    // which day they fall on.
    uniqueIndex("booking_creatorId_accepted_day_idx")
      .on(table.creatorId, sql`date_trunc('day', ${table.eventDate})`)
      .where(sql`${table.status} = 'accepted' AND ${table.eventDate} IS NOT NULL`),
  ],
);
