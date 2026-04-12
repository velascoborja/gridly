CREATE TABLE "additional_entries" (
	"id" serial PRIMARY KEY NOT NULL,
	"month_id" integer NOT NULL,
	"type" text NOT NULL,
	"label" text NOT NULL,
	"amount" numeric(12, 2) DEFAULT '0' NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "months" (
	"id" serial PRIMARY KEY NOT NULL,
	"year_id" integer NOT NULL,
	"month" integer NOT NULL,
	"home_expense" numeric(12, 2) DEFAULT '0' NOT NULL,
	"personal_expense" numeric(12, 2) DEFAULT '0' NOT NULL,
	"investment" numeric(12, 2) DEFAULT '0' NOT NULL,
	"payslip" numeric(12, 2) DEFAULT '0' NOT NULL,
	"additional_payslip" numeric(12, 2) DEFAULT '0' NOT NULL,
	"bonus" numeric(12, 2) DEFAULT '0' NOT NULL,
	"interests" numeric(12, 2) DEFAULT '0' NOT NULL,
	"personal_remaining" numeric(12, 2) DEFAULT '0' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "months_year_id_month_unique" UNIQUE("year_id","month")
);
--> statement-breakpoint
CREATE TABLE "years" (
	"id" serial PRIMARY KEY NOT NULL,
	"year" integer NOT NULL,
	"starting_balance" numeric(12, 2) DEFAULT '0' NOT NULL,
	"estimated_salary" numeric(12, 2) DEFAULT '0' NOT NULL,
	"monthly_investment" numeric(12, 2) DEFAULT '0' NOT NULL,
	"monthly_home_expense" numeric(12, 2) DEFAULT '0' NOT NULL,
	"monthly_personal_budget" numeric(12, 2) DEFAULT '0' NOT NULL,
	"interest_rate" numeric(5, 4) DEFAULT '0' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "years_year_unique" UNIQUE("year")
);
--> statement-breakpoint
ALTER TABLE "additional_entries" ADD CONSTRAINT "additional_entries_month_id_months_id_fk" FOREIGN KEY ("month_id") REFERENCES "public"."months"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "months" ADD CONSTRAINT "months_year_id_years_id_fk" FOREIGN KEY ("year_id") REFERENCES "public"."years"("id") ON DELETE cascade ON UPDATE no action;