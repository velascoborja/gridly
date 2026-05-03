import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("createAndPrefillYear server action exists and handles logic", () => {
  const source = readFileSync(new URL("../src/lib/server/actions/years.ts", import.meta.url), "utf8");

  assert.match(source, /export async function createAndPrefillYear/);
  assert.match(source, /getSessionUser/);
  assert.match(source, /\.insert\(years\)/);
  assert.match(source, /computeMonthChain/);
  assert.match(source, /\.insert\(months\)/);
  assert.match(source, /propagateYearCarryOver/);
  assert.match(source, /revalidatePath/);
});

test("createAndPrefillYear does not use unsupported neon-http interactive transactions", () => {
  const source = readFileSync(new URL("../src/lib/server/actions/years.ts", import.meta.url), "utf8");

  assert.doesNotMatch(source, /\.transaction\(/);
});
