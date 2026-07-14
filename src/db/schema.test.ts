import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("./schema.ts", import.meta.url), "utf8");

test("yearRecurringExpenses has a nullable tagId FK to tags with set null", () => {
  const block = source.slice(source.indexOf("yearRecurringExpenses ="), source.indexOf("monthlyRecurringExpenses ="));
  assert.match(block, /tagId: integer\("tag_id"\)\s*\.references\(\(\) => tags\.id, \{ onDelete: "set null" \}\)/);
});

test("monthlyRecurringExpenses has a nullable tagId FK to tags with set null", () => {
  const block = source.slice(source.indexOf("monthlyRecurringExpenses ="));
  assert.match(block, /tagId: integer\("tag_id"\)\s*\.references\(\(\) => tags\.id, \{ onDelete: "set null" \}\)/);
});

test("additional entries and groups persist completion with a false default", () => {
  const entriesBlock = source.slice(source.indexOf("additionalEntries ="), source.indexOf("export const tags ="));
  const groupsBlock = source.slice(source.indexOf("additionalEntryGroups ="), source.indexOf("additionalEntries ="));

  assert.match(entriesBlock, /isCompleted: boolean\("is_completed"\)\.notNull\(\)\.default\(false\)/);
  assert.match(groupsBlock, /isCompleted: boolean\("is_completed"\)\.notNull\(\)\.default\(false\)/);
});
