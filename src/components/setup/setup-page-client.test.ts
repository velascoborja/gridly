import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("extra payments toggle uses an animated switch and reveal", () => {
  const source = readFileSync(new URL("./setup-page-client.tsx", import.meta.url), "utf8");

  assert.match(source, /className="[^"]*sr-only[^"]*"/);
  assert.match(source, /role="switch"/);
  assert.match(source, /transition-\[background-color,box-shadow\]/);
  assert.match(source, /transition-transform/);
  assert.match(source, /translate-x-5/);
  assert.match(source, /transition-\[grid-template-rows,opacity,margin-top\]/);
  assert.match(source, /overflow-hidden px-1 pb-2/);
  assert.match(source, /aria-hidden=\{!hasExtraPayments\}/);
});

test("setup submits recurring expense templates with the year config", () => {
  const source = readFileSync(new URL("./setup-page-client.tsx", import.meta.url), "utf8");

  assert.match(source, /RecurringExpenseTemplateEditor/);
  assert.match(source, /const \[recurringExpenses, setRecurringExpenses\]/);
  assert.match(source, /recurringExpenses,/);
});

test("setup numeric fields start empty and use translated placeholder hints", () => {
  const source = readFileSync(new URL("./setup-page-client.tsx", import.meta.url), "utf8");

  assert.match(source, /placeholder: t\("estimatedSalaryPlaceholder"\)/);
  assert.match(source, /placeholder: t\("monthlyHomeExpensePlaceholder"\)/);
  assert.match(source, /placeholder: t\("monthlyPersonalBudgetPlaceholder"\)/);
  assert.match(source, /placeholder: t\("monthlyInvestmentPlaceholder"\)/);
  assert.match(source, /placeholder: t\("interestRatePlaceholder"\)/);
  assert.match(source, /\["startingBalance", startingBalanceEditable \? "" : String\(derivedStartingBalance\)\]/);
  assert.match(source, /\["estimatedExtraPayment", ""\]/);
  assert.doesNotMatch(source, /defaultValue: "0"/);
});

test("create year submission refreshes before returning to the selected route", () => {
  const source = readFileSync(new URL("./setup-page-client.tsx", import.meta.url), "utf8");

  assert.match(source, /window\.location\.href = /);
});

test("setup screen uses guided section translation keys", () => {
  const source = readFileSync(new URL("./setup-page-client.tsx", import.meta.url), "utf8");

  assert.match(source, /SETUP_STEPS/);
  assert.match(source, /id: "starting-point"/);
  assert.match(source, /id: "income"/);
  assert.match(source, /id: "monthly-plan"/);
  assert.match(source, /id: "recurring-expenses"/);
  assert.match(source, /id: "review-create"/);
  assert.match(source, /t\("sections\.startingPoint\.title"\)/);
  assert.match(source, /t\("sections\.income\.title"\)/);
  assert.match(source, /t\("sections\.monthlyPlan\.title"\)/);
  assert.match(source, /t\("sections\.growth\.title"\)/);
  assert.match(source, /t\("sections\.recurringExpenses\.title"\)/);
  assert.match(source, /t\("sections\.reviewCreate\.title"\)/);
});

test("setup screen removes the decorative blue-card status copy", () => {
  const source = readFileSync(new URL("./setup-page-client.tsx", import.meta.url), "utf8");

  assert.doesNotMatch(source, /guidedConfig/);
  assert.doesNotMatch(source, /startingBalanceReal/);
  assert.doesNotMatch(source, /extraPaysLabel/);
  assert.doesNotMatch(source, /redirectionLabel/);
  assert.doesNotMatch(source, /redirectionNote/);
});

test("setup summary derives values from local state without adding payload fields", () => {
  const source = readFileSync(new URL("./setup-page-client.tsx", import.meta.url), "utf8");

  assert.match(source, /const summary = /);
  assert.match(source, /parseNumber\(values\.estimatedSalary\)/);
  assert.match(source, /parseNumber\(values\.monthlyHomeExpense\)/);
  assert.match(source, /parseNumber\(values\.monthlyPersonalBudget\)/);
  assert.match(source, /parseNumber\(values\.monthlyInvestment\)/);
  assert.match(source, /summary\.estimatedMonthlySavings/);
  assert.match(source, /t\("summary\.title"\)/);
  assert.match(source, /t\("summary\.monthlySavings"\)/);

  const payloadMatch = source.match(/const payload = \{[\s\S]*?recurringExpenses,\n\s*\};/);
  assert.ok(payloadMatch);
  assert.doesNotMatch(payloadMatch[0], /estimatedMonthlySavings/);
});
