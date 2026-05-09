ALTER TABLE "users" ADD COLUMN "email_hash" text;
--> statement-breakpoint
ALTER TABLE "users" DROP CONSTRAINT "users_email_unique";
--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_email_hash_unique" UNIQUE("email_hash");
