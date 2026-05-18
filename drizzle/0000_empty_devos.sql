CREATE TABLE "accounts" (
	"user_id" text NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"provider_account_id" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text,
	CONSTRAINT "accounts_provider_provider_account_id_pk" PRIMARY KEY("provider","provider_account_id")
);
--> statement-breakpoint
CREATE TABLE "additional_entries" (
	"id" serial PRIMARY KEY NOT NULL,
	"month_id" integer NOT NULL,
	"group_id" integer,
	"type" text NOT NULL,
	"label" text NOT NULL,
	"amount" numeric(12, 2) DEFAULT '0' NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "additional_entry_groups" (
	"id" serial PRIMARY KEY NOT NULL,
	"month_id" integer NOT NULL,
	"label" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "authenticators" (
	"credential_id" text NOT NULL,
	"user_id" text NOT NULL,
	"provider_account_id" text NOT NULL,
	"credential_public_key" text NOT NULL,
	"counter" integer NOT NULL,
	"credential_device_type" text NOT NULL,
	"credential_backed_up" boolean NOT NULL,
	"transports" text,
	CONSTRAINT "authenticators_user_id_credential_id_pk" PRIMARY KEY("user_id","credential_id"),
	CONSTRAINT "authenticators_credential_id_unique" UNIQUE("credential_id")
);
--> statement-breakpoint
CREATE TABLE "historical_years" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"year" integer NOT NULL,
	"starting_balance" numeric(12, 2) DEFAULT '0' NOT NULL,
	"final_balance" numeric(12, 2) DEFAULT '0' NOT NULL,
	"invested_amount" numeric(12, 2) DEFAULT '0' NOT NULL,
	"savings_rate" numeric(5, 4),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "historical_years_user_id_year_unique" UNIQUE("user_id","year")
);
--> statement-breakpoint
CREATE TABLE "monthly_recurring_expenses" (
	"id" serial PRIMARY KEY NOT NULL,
	"month_id" integer NOT NULL,
	"year_recurring_expense_id" integer,
	"label" text NOT NULL,
	"amount" numeric(12, 2) DEFAULT '0' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
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
	"investment_manual_override" boolean DEFAULT false NOT NULL,
	"payslip" numeric(12, 2) DEFAULT '0' NOT NULL,
	"payslip_manual_override" boolean DEFAULT false NOT NULL,
	"additional_payslip" numeric(12, 2) DEFAULT '0' NOT NULL,
	"additional_payslip_manual_override" boolean DEFAULT false NOT NULL,
	"interests" numeric(12, 2) DEFAULT '0' NOT NULL,
	"interests_manual_override" boolean DEFAULT false NOT NULL,
	"home_expense_manual_override" boolean DEFAULT false NOT NULL,
	"personal_expense_manual_override" boolean DEFAULT false NOT NULL,
	"personal_remaining" numeric(12, 2) DEFAULT '0' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "months_year_id_month_unique" UNIQUE("year_id","month")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"session_token" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"expires" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"email" text NOT NULL,
	"email_verified" timestamp,
	"image" text,
	"language" text DEFAULT 'es',
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification_tokens" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp NOT NULL,
	CONSTRAINT "verification_tokens_identifier_token_pk" PRIMARY KEY("identifier","token")
);
--> statement-breakpoint
CREATE TABLE "year_recurring_expenses" (
	"id" serial PRIMARY KEY NOT NULL,
	"year_id" integer NOT NULL,
	"label" text NOT NULL,
	"amount" numeric(12, 2) DEFAULT '0' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "years" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text,
	"year" integer NOT NULL,
	"starting_balance" numeric(12, 2) DEFAULT '0' NOT NULL,
	"estimated_salary" numeric(12, 2) DEFAULT '0' NOT NULL,
	"has_extra_payments" boolean DEFAULT false NOT NULL,
	"estimated_extra_payment" numeric(12, 2) DEFAULT '0' NOT NULL,
	"monthly_investment" numeric(12, 2) DEFAULT '0' NOT NULL,
	"monthly_home_expense" numeric(12, 2) DEFAULT '0' NOT NULL,
	"monthly_personal_budget" numeric(12, 2) DEFAULT '0' NOT NULL,
	"interest_rate" numeric(5, 4) DEFAULT '0' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "years_user_id_year_unique" UNIQUE("user_id","year")
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "additional_entries" ADD CONSTRAINT "additional_entries_month_id_months_id_fk" FOREIGN KEY ("month_id") REFERENCES "public"."months"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "additional_entries" ADD CONSTRAINT "additional_entries_group_id_additional_entry_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."additional_entry_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "additional_entry_groups" ADD CONSTRAINT "additional_entry_groups_month_id_months_id_fk" FOREIGN KEY ("month_id") REFERENCES "public"."months"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "authenticators" ADD CONSTRAINT "authenticators_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "historical_years" ADD CONSTRAINT "historical_years_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "monthly_recurring_expenses" ADD CONSTRAINT "monthly_recurring_expenses_month_id_months_id_fk" FOREIGN KEY ("month_id") REFERENCES "public"."months"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "monthly_recurring_expenses" ADD CONSTRAINT "monthly_recurring_expenses_year_recurring_expense_id_year_recurring_expenses_id_fk" FOREIGN KEY ("year_recurring_expense_id") REFERENCES "public"."year_recurring_expenses"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "months" ADD CONSTRAINT "months_year_id_years_id_fk" FOREIGN KEY ("year_id") REFERENCES "public"."years"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "year_recurring_expenses" ADD CONSTRAINT "year_recurring_expenses_year_id_years_id_fk" FOREIGN KEY ("year_id") REFERENCES "public"."years"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "years" ADD CONSTRAINT "years_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;