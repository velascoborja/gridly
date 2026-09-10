import test from "node:test";
import assert from "node:assert/strict";
import {
  GROUPED_ENTRY_MONTH_ERROR,
  GROUPED_ENTRY_RECURRING_ERROR,
  GROUPED_ENTRY_TYPE_ERROR,
  validateGroupedEntryState,
} from "./additional-entry-grouping.ts";

test("a grouped entry must be a non-recurring expense in the group's month", () => {
  assert.equal(
    validateGroupedEntryState({ type: "expense", isRecurring: false, entryMonthId: 1, groupMonthId: 1 }),
    null,
  );
  assert.equal(
    validateGroupedEntryState({ type: "income", isRecurring: false, entryMonthId: 1, groupMonthId: 1 }),
    GROUPED_ENTRY_TYPE_ERROR,
  );
  assert.equal(
    validateGroupedEntryState({ type: "expense", isRecurring: true, entryMonthId: 1, groupMonthId: 1 }),
    GROUPED_ENTRY_RECURRING_ERROR,
  );
  assert.equal(
    validateGroupedEntryState({ type: "expense", isRecurring: false, entryMonthId: 2, groupMonthId: 1 }),
    GROUPED_ENTRY_MONTH_ERROR,
  );
});
