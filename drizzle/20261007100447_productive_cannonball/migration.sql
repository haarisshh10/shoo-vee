CREATE TABLE "account" (
	"id" text PRIMARY KEY,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL UNIQUE,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY,
	"name" text NOT NULL,
	"email" text NOT NULL UNIQUE,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "creator_profile" (
	"id" text PRIMARY KEY,
	"user_id" text NOT NULL,
	"display_name" text NOT NULL,
	"bio" text,
	"profile_image_url" text,
	"cover_image_url" text,
	"location" text,
	"specialties" text[] DEFAULT '{}'::text[] NOT NULL,
	"creator_types" text[] DEFAULT '{}'::text[] NOT NULL,
	"starting_price" integer,
	"currency" text DEFAULT 'INR' NOT NULL,
	"verification_status" text DEFAULT 'unverified' NOT NULL,
	"experience_years" integer,
	"social_links" jsonb,
	"languages" text[] DEFAULT '{}'::text[] NOT NULL,
	"availability_status" text DEFAULT 'available' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "portfolio_item" (
	"id" text PRIMARY KEY,
	"creator_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"media_url" text NOT NULL,
	"media_type" text NOT NULL,
	"category" text NOT NULL,
	"tags" text[] DEFAULT '{}'::text[] NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "service" (
	"id" text PRIMARY KEY,
	"creator_id" text NOT NULL,
	"title" text NOT NULL,
	"category" text NOT NULL,
	"description" text,
	"price" integer NOT NULL,
	"currency" text DEFAULT 'INR' NOT NULL,
	"pricing_unit" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "creator_equipment" (
	"creator_id" text,
	"equipment_id" text,
	CONSTRAINT "creator_equipment_pkey" PRIMARY KEY("creator_id","equipment_id")
);
--> statement-breakpoint
CREATE TABLE "equipment" (
	"id" text PRIMARY KEY,
	"name" text NOT NULL,
	"brand" text,
	"model" text,
	"category" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "post" (
	"id" text PRIMARY KEY,
	"creator_id" text NOT NULL,
	"caption" text,
	"media_url" text NOT NULL,
	"media_type" text NOT NULL,
	"location" text,
	"tags" text[] DEFAULT '{}'::text[] NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "booking" (
	"id" text PRIMARY KEY,
	"customer_id" text NOT NULL,
	"creator_id" text NOT NULL,
	"service_id" text,
	"event_date" timestamp,
	"location" text,
	"message" text,
	"agreed_price" integer,
	"currency" text DEFAULT 'INR' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gig" (
	"id" text PRIMARY KEY,
	"poster_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"role_needed" text NOT NULL,
	"location" text,
	"pay" integer,
	"currency" text DEFAULT 'INR' NOT NULL,
	"date" timestamp,
	"status" text DEFAULT 'open' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gig_application" (
	"id" text PRIMARY KEY,
	"gig_id" text NOT NULL,
	"applicant_id" text NOT NULL,
	"message" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "review" (
	"id" text PRIMARY KEY,
	"creator_id" text NOT NULL,
	"reviewer_id" text NOT NULL,
	"booking_id" text NOT NULL,
	"rating" integer NOT NULL,
	"comment" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "review_rating_between_1_and_5" CHECK ("rating" between 1 and 5)
);
--> statement-breakpoint
CREATE TABLE "notification" (
	"id" text PRIMARY KEY,
	"user_id" text NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"body" text,
	"read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "account" ("user_id");--> statement-breakpoint
CREATE INDEX "session_userId_idx" ON "session" ("user_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" ("identifier");--> statement-breakpoint
CREATE UNIQUE INDEX "creator_profile_userId_idx" ON "creator_profile" ("user_id");--> statement-breakpoint
CREATE INDEX "creator_profile_location_idx" ON "creator_profile" ("location");--> statement-breakpoint
CREATE INDEX "creator_profile_verificationStatus_idx" ON "creator_profile" ("verification_status");--> statement-breakpoint
CREATE INDEX "creator_profile_createdAt_idx" ON "creator_profile" ("created_at");--> statement-breakpoint
CREATE INDEX "portfolio_item_creatorId_idx" ON "portfolio_item" ("creator_id");--> statement-breakpoint
CREATE INDEX "portfolio_item_category_idx" ON "portfolio_item" ("category");--> statement-breakpoint
CREATE INDEX "portfolio_item_createdAt_idx" ON "portfolio_item" ("created_at");--> statement-breakpoint
CREATE INDEX "service_creatorId_idx" ON "service" ("creator_id");--> statement-breakpoint
CREATE INDEX "service_category_idx" ON "service" ("category");--> statement-breakpoint
CREATE INDEX "service_createdAt_idx" ON "service" ("created_at");--> statement-breakpoint
CREATE INDEX "creator_equipment_equipmentId_idx" ON "creator_equipment" ("equipment_id");--> statement-breakpoint
CREATE INDEX "equipment_category_idx" ON "equipment" ("category");--> statement-breakpoint
CREATE INDEX "equipment_name_idx" ON "equipment" ("name");--> statement-breakpoint
CREATE INDEX "post_creatorId_idx" ON "post" ("creator_id");--> statement-breakpoint
CREATE INDEX "post_createdAt_idx" ON "post" ("created_at");--> statement-breakpoint
CREATE INDEX "booking_customerId_idx" ON "booking" ("customer_id");--> statement-breakpoint
CREATE INDEX "booking_creatorId_idx" ON "booking" ("creator_id");--> statement-breakpoint
CREATE INDEX "booking_status_idx" ON "booking" ("status");--> statement-breakpoint
CREATE INDEX "booking_createdAt_idx" ON "booking" ("created_at");--> statement-breakpoint
CREATE INDEX "gig_posterId_idx" ON "gig" ("poster_id");--> statement-breakpoint
CREATE INDEX "gig_status_idx" ON "gig" ("status");--> statement-breakpoint
CREATE INDEX "gig_createdAt_idx" ON "gig" ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "gig_application_gigId_applicantId_idx" ON "gig_application" ("gig_id","applicant_id");--> statement-breakpoint
CREATE INDEX "gig_application_applicantId_idx" ON "gig_application" ("applicant_id");--> statement-breakpoint
CREATE INDEX "gig_application_status_idx" ON "gig_application" ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "review_bookingId_idx" ON "review" ("booking_id");--> statement-breakpoint
CREATE INDEX "review_creatorId_idx" ON "review" ("creator_id");--> statement-breakpoint
CREATE INDEX "review_reviewerId_idx" ON "review" ("reviewer_id");--> statement-breakpoint
CREATE INDEX "notification_userId_idx" ON "notification" ("user_id");--> statement-breakpoint
CREATE INDEX "notification_createdAt_idx" ON "notification" ("created_at");--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "creator_profile" ADD CONSTRAINT "creator_profile_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "portfolio_item" ADD CONSTRAINT "portfolio_item_creator_id_creator_profile_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "creator_profile"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "service" ADD CONSTRAINT "service_creator_id_creator_profile_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "creator_profile"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "creator_equipment" ADD CONSTRAINT "creator_equipment_creator_id_creator_profile_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "creator_profile"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "creator_equipment" ADD CONSTRAINT "creator_equipment_equipment_id_equipment_id_fkey" FOREIGN KEY ("equipment_id") REFERENCES "equipment"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "post" ADD CONSTRAINT "post_creator_id_creator_profile_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "creator_profile"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "booking" ADD CONSTRAINT "booking_customer_id_user_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "booking" ADD CONSTRAINT "booking_creator_id_creator_profile_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "creator_profile"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "booking" ADD CONSTRAINT "booking_service_id_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "service"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "gig" ADD CONSTRAINT "gig_poster_id_user_id_fkey" FOREIGN KEY ("poster_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "gig_application" ADD CONSTRAINT "gig_application_gig_id_gig_id_fkey" FOREIGN KEY ("gig_id") REFERENCES "gig"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "gig_application" ADD CONSTRAINT "gig_application_applicant_id_user_id_fkey" FOREIGN KEY ("applicant_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "review" ADD CONSTRAINT "review_creator_id_creator_profile_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "creator_profile"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "review" ADD CONSTRAINT "review_reviewer_id_user_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "review" ADD CONSTRAINT "review_booking_id_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "booking"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "notification" ADD CONSTRAINT "notification_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;