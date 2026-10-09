CREATE TABLE "follow" (
	"id" text PRIMARY KEY,
	"follower_id" text NOT NULL,
	"creator_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "saved_creator" (
	"id" text PRIMARY KEY,
	"user_id" text NOT NULL,
	"creator_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "follow_followerId_creatorId_idx" ON "follow" ("follower_id","creator_id");--> statement-breakpoint
CREATE INDEX "follow_creatorId_idx" ON "follow" ("creator_id");--> statement-breakpoint
CREATE UNIQUE INDEX "saved_creator_userId_creatorId_idx" ON "saved_creator" ("user_id","creator_id");--> statement-breakpoint
CREATE INDEX "saved_creator_creatorId_idx" ON "saved_creator" ("creator_id");--> statement-breakpoint
ALTER TABLE "follow" ADD CONSTRAINT "follow_follower_id_user_id_fkey" FOREIGN KEY ("follower_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "follow" ADD CONSTRAINT "follow_creator_id_creator_profile_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "creator_profile"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "saved_creator" ADD CONSTRAINT "saved_creator_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "saved_creator" ADD CONSTRAINT "saved_creator_creator_id_creator_profile_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "creator_profile"("id") ON DELETE CASCADE;