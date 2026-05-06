ALTER TABLE "years" ALTER COLUMN "starting_balance" TYPE text USING "starting_balance"::text;--> statement-breakpoint
ALTER TABLE "years" ALTER COLUMN "estimated_salary" TYPE text USING "estimated_salary"::text;--> statement-breakpoint
ALTER TABLE "years" ALTER COLUMN "estimated_extra_payment" TYPE text USING "estimated_extra_payment"::text;--> statement-breakpoint
ALTER TABLE "years" ALTER COLUMN "monthly_investment" TYPE text USING "monthly_investment"::text;--> statement-breakpoint
ALTER TABLE "years" ALTER COLUMN "monthly_home_expense" TYPE text USING "monthly_home_expense"::text;--> statement-breakpoint
ALTER TABLE "years" ALTER COLUMN "monthly_personal_budget" TYPE text USING "monthly_personal_budget"::text;--> statement-breakpoint
ALTER TABLE "years" ALTER COLUMN "interest_rate" TYPE text USING "interest_rate"::text;--> statement-breakpoint

ALTER TABLE "months" ALTER COLUMN "home_expense" TYPE text USING "home_expense"::text;--> statement-breakpoint
ALTER TABLE "months" ALTER COLUMN "personal_expense" TYPE text USING "personal_expense"::text;--> statement-breakpoint
ALTER TABLE "months" ALTER COLUMN "investment" TYPE text USING "investment"::text;--> statement-breakpoint
ALTER TABLE "months" ALTER COLUMN "payslip" TYPE text USING "payslip"::text;--> statement-breakpoint
ALTER TABLE "months" ALTER COLUMN "additional_payslip" TYPE text USING "additional_payslip"::text;--> statement-breakpoint
ALTER TABLE "months" ALTER COLUMN "interests" TYPE text USING "interests"::text;--> statement-breakpoint
ALTER TABLE "months" ALTER COLUMN "personal_remaining" TYPE text USING "personal_remaining"::text;--> statement-breakpoint

ALTER TABLE "additional_entries" ALTER COLUMN "amount" TYPE text USING "amount"::text;--> statement-breakpoint
ALTER TABLE "year_recurring_expenses" ALTER COLUMN "amount" TYPE text USING "amount"::text;--> statement-breakpoint
ALTER TABLE "monthly_recurring_expenses" ALTER COLUMN "amount" TYPE text USING "amount"::text;
