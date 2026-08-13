import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("./year-data.ts", import.meta.url), "utf8");

test("year-data parallelizes independent Neon queries", () => {
  const monthAndTemplateBatch = source.indexOf(
    "const [monthRows, recurringTemplates] = await Promise.all([",
  );
  const monthDependentBatch = source.indexOf(
    "const [allEntries, allGroups, allRecurringExpenses] =",
  );
  const monthDependentPromiseAll = source.indexOf(
    "await Promise.all([",
    monthDependentBatch,
  );
  const tagHydration = source.indexOf("const tagRows =", monthDependentPromiseAll);

  assert.ok(monthAndTemplateBatch >= 0, "months and recurring templates should load concurrently");
  assert.ok(monthDependentBatch > monthAndTemplateBatch, "month-dependent reads should follow month loading");
  assert.ok(monthDependentPromiseAll > monthDependentBatch, "month-dependent reads should load concurrently");
  assert.ok(tagHydration > monthDependentPromiseAll, "tag hydration should remain after tag IDs are collected");
});

test("year-data includes recurring expense tagIds in usedTagIds", () => {
  assert.match(source, /allRecurringExpenses\.map\(\(e\) => e\.tagId\)/);
});

test("year-data resolves tag on each recurring expense", () => {
  assert.match(source, /parseMonthlyRecurringExpense\(r, resolveTag\(r\.tagId\)\)/);
});

test("year-data only hydrates tags owned by the requested user", () => {
  assert.match(source, /eq\(tags\.userId, userId\)/);
  assert.match(source, /inArray\(tags\.id, usedTagIds\)/);
});

test("year-data hydrates completion for entries and groups", () => {
  assert.match(source, /isCompleted: group\.isCompleted/);
  assert.match(source, /isCompleted: e\.isCompleted/);
});
