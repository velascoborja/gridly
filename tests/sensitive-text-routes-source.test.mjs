import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

async function readSource(path) {
  return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

test("year data decrypts all protected finance labels before returning YearData", async () => {
  const source = await readSource("src/lib/server/year-data.ts");

  assert.match(source, /parseProtectedMonthlyRecurringExpense/);
  assert.match(source, /parseProtectedYearRecurringExpense/);
  assert.match(source, /parseProtectedAdditionalEntry/);
  assert.doesNotMatch(source, /label:\s*entry\.label/);
});

test("additional entry APIs encrypt labels before writes and decrypt responses", async () => {
  const createSource = await readSource("src/app/api/months/[monthId]/entries/route.ts");
  const itemSource = await readSource("src/app/api/months/[monthId]/entries/[entryId]/route.ts");

  assert.match(createSource, /protectFreeTextLabel\(label\)/);
  assert.match(createSource, /parseProtectedAdditionalEntry\(entry\)/);
  assert.match(itemSource, /protectFreeTextLabel\(body\.label\)/);
  assert.match(itemSource, /parseProtectedAdditionalEntry\(updated\)/);
});

test("recurring expense APIs and setup encrypt labels before writes", async () => {
  const yearsRoute = await readSource("src/app/api/years/route.ts");
  const serverAction = await readSource("src/lib/server/actions/years.ts");
  const recurringRoute = await readSource("src/app/api/years/[year]/recurring-expenses/route.ts");
  const monthlyRoute = await readSource("src/app/api/months/[monthId]/recurring-expenses/[entryId]/route.ts");

  assert.match(yearsRoute, /protectFreeTextLabel\(entry\.label\)/);
  assert.match(serverAction, /protectFreeTextLabel\(entry\.label\)/);
  assert.match(recurringRoute, /protectFreeTextLabel\(entry\.label\)/);
  assert.match(recurringRoute, /parseProtectedYearRecurringExpense/);
  assert.match(monthlyRoute, /protectFreeTextLabel\(body\.label\)/);
  assert.match(monthlyRoute, /parseProtectedMonthlyRecurringExpense\(updated\)/);
});
