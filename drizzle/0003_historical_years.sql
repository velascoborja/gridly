CREATE TABLE "historical_years" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL,
  "year" integer NOT NULL,
  "starting_balance" numeric(12, 2) DEFAULT '0' NOT NULL,
  "final_balance" numeric(12, 2) DEFAULT '0' NOT NULL,
  "invested_amount" numeric(12, 2) DEFAULT '0' NOT NULL,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now(),
  CONSTRAINT "historical_years_user_id_year_unique" UNIQUE("user_id", "year")
);
--> statement-breakpoint
ALTER TABLE "historical_years" ADD CONSTRAINT "historical_years_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
