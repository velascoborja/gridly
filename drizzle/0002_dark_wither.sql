ALTER TABLE "months" ADD COLUMN "interests_manual_override" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "years" ADD COLUMN "has_extra_payments" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "years" ADD COLUMN "estimated_extra_payment" numeric(12, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
UPDATE "years" SET "has_extra_payments" = true, "estimated_extra_payment" = "estimated_salary";
