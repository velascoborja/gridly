import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const es = JSON.parse(readFileSync(new URL("../../messages/es.json", import.meta.url), "utf8"));
const en = JSON.parse(readFileSync(new URL("../../messages/en.json", import.meta.url), "utf8"));

test("recurring tag confirmation keys exist in both locales", () => {
  for (const messages of [es, en]) {
    assert.ok(messages.RecurringExpenses.monthly.tagConfirmTitle);
    assert.ok(messages.RecurringExpenses.monthly.tagConfirmDescription);
    assert.ok(messages.RecurringExpenses.monthly.tagConfirmAction);
  }
});
