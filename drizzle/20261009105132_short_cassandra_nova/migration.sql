ALTER TABLE "creator_profile" ADD COLUMN "city" text;--> statement-breakpoint
ALTER TABLE "creator_profile" ADD COLUMN "neighborhood" text;--> statement-breakpoint
ALTER TABLE "creator_profile" ADD COLUMN "latitude" double precision;--> statement-breakpoint
ALTER TABLE "creator_profile" ADD COLUMN "longitude" double precision;--> statement-breakpoint
CREATE INDEX "creator_profile_city_idx" ON "creator_profile" ("city");