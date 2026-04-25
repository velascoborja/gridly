import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("schema defines annual templates and monthly recurring expense copies", () => {
  const source = readFileSync(new URL("../db/schema.ts", import.meta.url), "utf8");

  assert.match(source, /export const yearRecurringExpenses = pgTable\("year_recurring_expenses"/);
  assert.match(source, /export const monthlyRecurringExpenses = pgTable\("monthly_recurring_expenses"/);
  assert.match(source, /yearRecurringExpenseId: integer\("year_recurring_expense_id"\)/);
  assert.match(source, /sortOrder: integer\("sort_order"\)\.notNull\(\)\.default\(0\)/);
});

test("year creation and prefill persist recurring templates into every month", () => {
  const yearsRoute = readFileSync(new URL("../app/api/years/route.ts", import.meta.url), "utf8");
  const prefillRoute = readFileSync(new URL("../app/api/years/[year]/prefill/route.ts", import.meta.url), "utf8");

  assert.match(yearsRoute, /recurringExpenses = \[\]/);
  assert.match(yearsRoute, /yearRecurringExpenses/);
  assert.match(prefillRoute, /monthlyRecurringExpenses/);
  assert.match(prefillRoute, /yearRecurringExpenseId: template\.id/);
});

test("year data hydrates recurring templates and monthly recurring rows", () => {
  const source = readFileSync(new URL("./server/year-data.ts", import.meta.url), "utf8");

  assert.match(source, /yearRecurringExpenses/);
  assert.match(source, /monthlyRecurringExpenses/);
  assert.match(source, /recurringExpenses: sortRecurringExpensesAsc/);
  assert.match(source, /recurringExpenses: sortRecurringExpensesAsc\(recurringTemplates/);
});

test("API routes expose annual template and monthly recurring expense mutations", () => {
  const annualRoute = readFileSync(new URL("../app/api/years/[year]/recurring-expenses/route.ts", import.meta.url), "utf8");
  const monthlyEntryRoute = readFileSync(new URL("../app/api/months/[monthId]/recurring-expenses/[entryId]/route.ts", import.meta.url), "utf8");

  assert.match(annualRoute, /export async function GET/);
  assert.match(annualRoute, /export async function PUT/);
  assert.match(annualRoute, /delete\(monthlyRecurringExpenses\)/);
  assert.match(monthlyEntryRoute, /export async function PATCH/);
  assert.match(monthlyEntryRoute, /export async function DELETE/);
});
