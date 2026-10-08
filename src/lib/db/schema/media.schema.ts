import { index, integer, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

import { user } from "./auth.schema";
import type { MediaType } from "./types";

/**
 * One uploaded file, owned by the account that uploaded it.
 *
 * The bytes live in whatever the storage driver holds — on disk under `.data/uploads` for now —
 * and `storage_key` is the only handle on them. Nothing here is guessable from the row alone:
 * keys are random, and this table is what makes an upload findable again later.
 */
export const media = pgTable(
  "media",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    ownerId: text("owner_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    /** Key within the storage driver. Never derived from the original filename. */
    storageKey: text("storage_key").notNull(),
    /** Sniffed from the bytes, not from what the client claimed. */
    mimeType: text("mime_type").notNull(),
    kind: text("kind").$type<MediaType>().notNull(),
    byteSize: integer("byte_size").notNull(),
    width: integer("width"),
    height: integer("height"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("media_ownerId_idx").on(table.ownerId),
    index("media_createdAt_idx").on(table.createdAt),
    // A key is how the bytes are found, so it has to be unique.
    uniqueIndex("media_storageKey_idx").on(table.storageKey),
  ],
);
