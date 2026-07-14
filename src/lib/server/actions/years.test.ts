import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("./years.ts", import.meta.url), "utf8");

test("createAndPrefillYear queries entries where isRecurring is true", () => {
  assert.match(source, /eq\(additionalEntries\.isRecurring, true\)/);
});

test("createAndPrefillYear filters out grouped entries using isNull", () => {
  assert.match(source, /isNull\(additionalEntries\.groupId\)/);
});

test("createAndPrefillYear looks up the previous year by data.year - 1", () => {
  assert.match(source, /data\.year - 1/);
});

test("createAndPrefillYear carries tagId when copying recurring entries", () => {
  assert.match(source, /tagId: e\.tagId/);
});

test("createAndPrefillYear reopens copied recurring entries", () => {
  assert.match(source, /isCompleted: false/);
});
