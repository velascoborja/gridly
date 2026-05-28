import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("./recurring-expenses-list.tsx", import.meta.url), "utf8");

test("list fetches tags from /api/tags when not read-only", () => {
  assert.match(source, /fetch\("\/api\/tags"\)/);
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
