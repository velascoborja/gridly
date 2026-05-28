import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("./year-data.ts", import.meta.url), "utf8");

test("year-data includes recurring expense tagIds in usedTagIds", () => {
  assert.match(source, /allRecurringExpenses\.map\(\(e\) => e\.tagId\)/);
});

test("year-data resolves tag on each recurring expense", () => {
  assert.match(source, /parseMonthlyRecurringExpense\(r, resolveTag\(r\.tagId\)\)/);
});
