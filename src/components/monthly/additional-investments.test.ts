import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const card = readFileSync(new URL("./additional-entries-card.tsx", import.meta.url), "utf8");
const form = readFileSync(new URL("./entry-form-row.tsx", import.meta.url), "utf8");

test("investment actions are expense-only and use the accessible shared action controls", () => {
  assert.match(card, /type === "expense" \? \[\{\s*id: "investment"/);
  assert.match(card, /type === "expense" && !entry\.isCompleted && !completionPending \? \[\{\s*id: "investment"/);
  assert.match(form, /aria-pressed=\{action\.active \|\| undefined\}/);
  assert.match(card, /active: newInvestment/);
  assert.match(card, /active: editInvestment/);
});

test("investment badge remains present in editable and read-only rows, including mobile", () => {
  const badge = card.slice(card.indexOf("const investmentBadge ="), card.indexOf("return (", card.indexOf("const investmentBadge =")));
  assert.match(badge, /entry\.isInvestment/);
  assert.match(badge, /investmentBadge/);
  assert.doesNotMatch(badge, /className="[^"]*\b(hidden|sm:inline)\b/);
  assert.equal(card.match(/\{investmentBadge\}/g)?.length, 2);
});

test("marked investments cannot move to groups by menu or drag, while month moves remain available", () => {
  assert.match(card, /disabled: entry\.isInvestment \|\| editInvestment/);
  assert.match(card, /draggedUngroupedExpense=\{draggedUngroupedExpense\?\.isInvestment \? null : draggedUngroupedExpense\}/);
  assert.match(card, /toGroupId !== null && entry\.isInvestment/);
  assert.match(card, /onEntryMoveToMonth\(entry, target\.id\)/);
});

test("saving investments exposes pending and localized errors while preserving drafts on failure", () => {
  const add = card.slice(card.indexOf("const handleAdd ="), card.indexOf("const handleDelete ="));
  const edit = card.slice(card.indexOf("const handleEdit ="), card.indexOf("const handleCompletionToggle ="));
  for (const handler of [add, edit]) {
    assert.match(handler, /isInvestment: type === "expense"/);
    assert.match(handler, /if \(!res\.ok\) throw/);
    assert.match(handler, /router\.refresh\(\)/);
  }
  assert.match(add, /setIsAdding\(true\);\s*try/);
  assert.match(edit, /setSavingId\(id\);\s*try/);
  assert.match(card, /newSaveError \? <p role="alert"/);
  assert.match(card, /editSaveError \? <p role="alert"/);
  assert.match(card, /disabled=\{isAdding\}/);
});

test("annual recurrence copies the investment flag and both locales describe it", () => {
  const action = readFileSync(new URL("../../lib/server/actions/years.ts", import.meta.url), "utf8");
  assert.match(action, /isRecurring: true,\s*isInvestment: e\.isInvestment,\s*isCompleted: false/);
  for (const locale of ["es", "en"]) {
    const messages = JSON.parse(readFileSync(new URL(`../../../messages/${locale}.json`, import.meta.url), "utf8"));
    for (const key of ["investmentToggle", "investmentActive", "investmentBadge", "investmentGroupBlocked", "entrySaveError"]) {
      assert.ok(messages.Monthly.additionalEntries[key]);
    }
  }
});
