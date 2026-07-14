import test from "node:test";
import assert from "node:assert/strict";
import { COMPLETED_LOCK_ERROR, isCompletionOnlyRequest } from "./additional-entry-completion.ts";

test("incomplete resources accept normal mutations", () => {
  assert.equal(isCompletionOnlyRequest({ label: "Updated" }, false), true);
  assert.equal(isCompletionOnlyRequest({ isCompleted: true }, false), true);
});

test("completed resources only accept an exact reopen mutation", () => {
  assert.equal(isCompletionOnlyRequest({ isCompleted: false }, true), true);
  assert.equal(isCompletionOnlyRequest({ isCompleted: false, label: "Updated" }, true), false);
  assert.equal(isCompletionOnlyRequest({ isCompleted: true }, true), false);
  assert.equal(isCompletionOnlyRequest({}, true), false);
});

test("completed lock errors use the public API code", () => {
  assert.equal(COMPLETED_LOCK_ERROR, "completed_locked");
});
