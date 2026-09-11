import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("./recurring-expenses-list.tsx", import.meta.url), "utf8");

test("list consumes shared tags and creation without fetching its own catalog", () => {
  assert.doesNotMatch(source, /fetch\("\/api\/tags"/);
  assert.match(source, /tags: Tag\[\]/);
  assert.match(source, /onCreateTag: handleCreateTag/);
});

test("list renders a TagPicker", () => {
  assert.match(source, /<TagPicker/);
});

test("tag changes are confirmed before saving (pending state + AlertDialog)", () => {
  assert.match(source, /pendingTag/);
  assert.match(source, /AlertDialog/);
});

test("confirming a tag change PATCHes with tagId and refreshes the year", () => {
  assert.match(source, /JSON\.stringify\(\{ tagId/);
  assert.match(source, /router\.refresh\(\)/);
});
