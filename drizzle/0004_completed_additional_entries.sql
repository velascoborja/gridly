ALTER TABLE "additional_entries" ADD COLUMN "is_completed" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
ALTER TABLE "additional_entry_groups" ADD COLUMN "is_completed" boolean DEFAULT false NOT NULL;
