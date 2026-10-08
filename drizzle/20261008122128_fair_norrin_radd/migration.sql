CREATE TABLE "media" (
	"id" text PRIMARY KEY,
	"owner_id" text NOT NULL,
	"storage_key" text NOT NULL,
	"mime_type" text NOT NULL,
	"kind" text NOT NULL,
	"byte_size" integer NOT NULL,
	"width" integer,
	"height" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "media_ownerId_idx" ON "media" ("owner_id");--> statement-breakpoint
CREATE INDEX "media_createdAt_idx" ON "media" ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "media_storageKey_idx" ON "media" ("storage_key");--> statement-breakpoint
ALTER TABLE "media" ADD CONSTRAINT "media_owner_id_user_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "user"("id") ON DELETE CASCADE;