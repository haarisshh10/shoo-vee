CREATE TABLE "report" (
	"id" text PRIMARY KEY,
	"reporter_id" text NOT NULL,
	"target_type" text NOT NULL,
	"target_id" text NOT NULL,
	"reason" text NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "report_status_idx" ON "report" ("status");--> statement-breakpoint
CREATE INDEX "report_targetType_targetId_idx" ON "report" ("target_type","target_id");--> statement-breakpoint
CREATE UNIQUE INDEX "report_reporterId_targetType_targetId_idx" ON "report" ("reporter_id","target_type","target_id");--> statement-breakpoint
ALTER TABLE "report" ADD CONSTRAINT "report_reporter_id_user_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "user"("id") ON DELETE CASCADE;