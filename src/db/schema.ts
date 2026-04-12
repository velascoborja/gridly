import { pgTable, serial, integer, numeric, text, timestamp, unique } from "drizzle-orm/pg-core";

export const years = pgTable("years", {
  id: serial("id").primaryKey(),
  year: integer("year").notNull().unique(),
  startingBalance: numeric("starting_balance", { precision: 12, scale: 2 }).notNull().default("0"),
  estimatedSalary: numeric("estimated_salary", { precision: 12, scale: 2 }).notNull().default("0"),
  monthlyInvestment: numeric("monthly_investment", { precision: 12, scale: 2 }).notNull().default("0"),
  monthlyHomeExpense: numeric("monthly_home_expense", { precision: 12, scale: 2 }).notNull().default("0"),
  monthlyPersonalBudget: numeric("monthly_personal_budget", { precision: 12, scale: 2 }).notNull().default("0"),
  interestRate: numeric("interest_rate", { precision: 5, scale: 4 }).notNull().default("0"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const months = pgTable(
  "months",
  {
    id: serial("id").primaryKey(),
    yearId: integer("year_id")
      .notNull()
      .references(() => years.id, { onDelete: "cascade" }),
    month: integer("month").notNull(), // 1-12
    homeExpense: numeric("home_expense", { precision: 12, scale: 2 }).notNull().default("0"),
    personalExpense: numeric("personal_expense", { precision: 12, scale: 2 }).notNull().default("0"),
    investment: numeric("investment", { precision: 12, scale: 2 }).notNull().default("0"),
    payslip: numeric("payslip", { precision: 12, scale: 2 }).notNull().default("0"),
    additionalPayslip: numeric("additional_payslip", { precision: 12, scale: 2 }).notNull().default("0"),
    bonus: numeric("bonus", { precision: 12, scale: 2 }).notNull().default("0"),
    interests: numeric("interests", { precision: 12, scale: 2 }).notNull().default("0"),
    personalRemaining: numeric("personal_remaining", { precision: 12, scale: 2 }).notNull().default("0"),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (t) => [unique().on(t.yearId, t.month)]
);

export const additionalEntries = pgTable("additional_entries", {
  id: serial("id").primaryKey(),
  monthId: integer("month_id")
    .notNull()
    .references(() => months.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // 'income' | 'expense'
  label: text("label").notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull().default("0"),
  createdAt: timestamp("created_at").defaultNow(),
});
