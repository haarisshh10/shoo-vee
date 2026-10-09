ALTER TABLE "creator_profile" ADD COLUMN "slug" text;--> statement-breakpoint
CREATE UNIQUE INDEX "creator_profile_slug_idx" ON "creator_profile" ("slug");