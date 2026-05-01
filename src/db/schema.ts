import { pgTable, serial, integer, numeric, text, timestamp, unique, primaryKey, boolean } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: timestamp("email_verified", { mode: "date" }),
  image: text("image"),
  language: text("language").default("es"),
});

export const accounts = pgTable(
  "accounts",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (t) => ({
    compositePk: primaryKey({ columns: [t.provider, t.providerAccountId] }),
  })
);

export const sessions = pgTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (t) => ({
    compositePk: primaryKey({ columns: [t.identifier, t.token] }),
  })
);

export const authenticators = pgTable(
  "authenticators",
  {
    credentialID: text("credential_id").notNull().unique(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    providerAccountId: text("provider_account_id").notNull(),
    credentialPublicKey: text("credential_public_key").notNull(),
    counter: integer("counter").notNull(),
    credentialDeviceType: text("credential_device_type").notNull(),
    credentialBackedUp: boolean("credential_backed_up").notNull(),
    transports: text("transports"),
  },
  (t) => ({
    compositePk: primaryKey({ columns: [t.userId, t.credentialID] }),
  })
);

export const years = pgTable("years", {
  id: serial("id").primaryKey(),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
  year: integer("year").notNull(),
  startingBalance: numeric("starting_balance", { precision: 12, scale: 2 }).notNull().default("0"),
  estimatedSalary: numeric("estimated_salary", { precision: 12, scale: 2 }).notNull().default("0"),
  hasExtraPayments: boolean("has_extra_payments").notNull().default(false),
  estimatedExtraPayment: numeric("estimated_extra_payment", { precision: 12, scale: 2 }).notNull().default("0"),
  monthlyInvestment: numeric("monthly_investment", { precision: 12, scale: 2 }).notNull().default("0"),
  monthlyHomeExpense: numeric("monthly_home_expense", { precision: 12, scale: 2 }).notNull().default("0"),
  monthlyPersonalBudget: numeric("monthly_personal_budget", { precision: 12, scale: 2 }).notNull().default("0"),
  interestRate: numeric("interest_rate", { precision: 5, scale: 4 }).notNull().default("0"),
  createdAt: timestamp("created_at").defaultNow(),
}, (t) => [unique().on(t.userId, t.year)]);

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
    interests: numeric("interests", { precision: 12, scale: 2 }).notNull().default("0"),
    interestsManualOverride: boolean("interests_manual_override").notNull().default(false),
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

export const yearRecurringExpenses = pgTable("year_recurring_expenses", {
  id: serial("id").primaryKey(),
  yearId: integer("year_id")
    .notNull()
    .references(() => years.id, { onDelete: "cascade" }),
  label: text("label").notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull().default("0"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const monthlyRecurringExpenses = pgTable("monthly_recurring_expenses", {
  id: serial("id").primaryKey(),
  monthId: integer("month_id")
    .notNull()
    .references(() => months.id, { onDelete: "cascade" }),
  yearRecurringExpenseId: integer("year_recurring_expense_id")
    .references(() => yearRecurringExpenses.id, { onDelete: "set null" }),
  label: text("label").notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull().default("0"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
});
