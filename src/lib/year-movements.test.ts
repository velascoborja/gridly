import test from "node:test";
import assert from "node:assert/strict";
import { summarizeYearMovements } from "./year-movements.ts";
import { getDemoYearData } from "./demo/demo-year.ts";
import type { AdditionalEntry, MonthData } from "./types.ts";

function entry(id: number, amount: number, type: "expense" | "income" = "expense"): AdditionalEntry {
  return { id, amount, type, monthId: 1, label: `Entry ${id}`, isInvestment: false, isCompleted: false, isRecurring: false, tagId: null, tag: null };
}
function months(): MonthData[] {
  return getDemoYearData().months.map((month) => ({ ...month, additionalExpenses: [], additionalExpenseGroups: [], additionalIncomes: [] }));
}

test("monthly expenses include every grouped entry once and exclude fixed financial fields", () => {
  const data = months();
  data[0].additionalExpenses = [entry(1, 20)];
  data[0].additionalExpenseGroups = [{ id: 1, monthId: 1, label: "Trip", isCompleted: true, tagId: null, tag: null, entries: [entry(2, 30), entry(3, 40)] }];
  data[1].additionalExpenses = [{ ...entry(4, 10), isCompleted: true, isRecurring: true }];
  const result = summarizeYearMovements(data, "expense");
  assert.equal(result.total, 100);
  assert.equal(result.rows[0].total, 90);
  assert.equal(result.rows[0].entryCount, 3);
  assert.equal(result.rows[0].groups[0].total, 70);
  assert.equal(result.rows[0].isPeak, true);
  assert.equal(result.rows[0].barPercent, 100);
});

test("income mode excludes expense groups and includes future and incomplete entries", () => {
  const data = months();
  data[11].additionalIncomes = [entry(1, 150, "income")];
  data[11].additionalExpenses = [entry(2, 900)];
  const result = summarizeYearMovements(data, "income");
  assert.equal(result.total, 150);
  assert.equal(result.rows[11].isPeak, true);
  assert.deepEqual(result.rows[11].groups, []);
  assert.deepEqual(result.rows[11].entries.map((item) => item.id), [1]);
});

test("chronological results preserve savings and ending balances without mutating loaded data", () => {
  const data = months().reverse();
  data[0].additionalExpenses = [entry(1, 10), entry(2, 30)];
  const before = JSON.stringify(data);
  const result = summarizeYearMovements(data, "expense");
  assert.deepEqual(result.rows.map((row) => row.month.month), Array.from({ length: 12 }, (_, index) => index + 1));
  assert.equal(result.rows[11].month, data[0]);
  assert.equal(result.rows[11].month.savings, data[0].savings);
  assert.equal(result.rows[11].month.endingBalance, data[0].endingBalance);
  assert.deepEqual(result.rows[11].entries.map((item) => item.amount), [30, 10]);
  assert.equal(JSON.stringify(data), before);
});

test("all months tying for the maximum are marked, including decimal sums", () => {
  const data = months();
  data[0].additionalExpenses = [entry(1, 0.1), entry(2, 0.2)];
  data[1].additionalExpenses = [entry(3, 0.3)];
  const result = summarizeYearMovements(data, "expense");
  assert.deepEqual(result.rows.filter((row) => row.isPeak).map((row) => row.month.month), [1, 2]);
});

test("empty years keep their twelve months without an artificial peak or invalid bar widths", () => {
  const result = summarizeYearMovements(months(), "expense");
  assert.equal(result.rows.length, 12);
  assert.equal(result.total, 0);
  assert.equal(result.maximum, null);
  assert.ok(result.rows.every((row) => !row.isPeak && row.barPercent === 0));
});

test("negative amounts retain their sign and use bounded comparison bars", () => {
  const data = months();
  data[0].additionalExpenses = [entry(1, -40)];
  data[1].additionalExpenses = [entry(2, -10)];
  const result = summarizeYearMovements(data, "expense");
  assert.equal(result.total, -50);
  assert.equal(result.maximum, -10);
  assert.equal(result.rows[1].isPeak, true);
  assert.ok(result.rows.every((row) => Number.isFinite(row.barPercent) && row.barPercent >= 0 && row.barPercent <= 100));
});

test("zero-value recorded entries are distinct from empty months and empty groups", () => {
  const data = months();
  data[0].additionalExpenses = [entry(1, 0)];
  data[1].additionalExpenseGroups = [{ id: 2, monthId: 2, label: "Empty", isCompleted: false, tagId: null, tag: null, entries: [] }];
  const result = summarizeYearMovements(data, "expense");
  assert.equal(result.maximum, 0);
  assert.equal(result.rows[0].isPeak, true);
  assert.equal(result.rows[1].isPeak, false);
  assert.deepEqual(result.rows[1].groups, []);
});

test("fresh shared monthly data immediately changes the annual total and peak", () => {
  const data = months();
  data[0].additionalExpenses = [entry(1, 50)];
  assert.equal(summarizeYearMovements(data, "expense").total, 50);
  const updated = data.map((month) => month.month === 2 ? { ...month, additionalExpenses: [entry(2, 100)] } : month);
  const result = summarizeYearMovements(updated, "expense");
  assert.equal(result.total, 150);
  assert.equal(result.rows[1].isPeak, true);
});
