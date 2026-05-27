import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { TAG_COLORS, TAG_COLOR_KEYS } from "./tags.ts";

const EXPECTED_KEYS = ["rose", "orange", "amber", "emerald", "cyan", "blue", "violet", "pink", "slate"];

test("TAG_COLOR_KEYS contains all 9 palette entries", () => {
  assert.deepStrictEqual(TAG_COLOR_KEYS, EXPECTED_KEYS);
});

test("TAG_COLORS has an entry for every key in TAG_COLOR_KEYS", () => {
  for (const key of TAG_COLOR_KEYS) {
    assert.ok(TAG_COLORS[key], `Missing color entry for key: ${key}`);
    assert.ok(TAG_COLORS[key].bg, `Missing bg for key: ${key}`);
    assert.ok(TAG_COLORS[key].border, `Missing border for key: ${key}`);
    assert.ok(TAG_COLORS[key].text, `Missing text for key: ${key}`);
  }
});

test("tags feature docs describe Settings management and update/delete endpoints", () => {
  const docs = readFileSync(new URL("../../docs/features/tags.md", import.meta.url), "utf8");

  assert.match(docs, /managed globally from the main Settings page/);
  assert.match(docs, /PATCH \/api\/tags\/\[tagId\]/);
  assert.match(docs, /DELETE \/api\/tags\/\[tagId\]/);
  assert.match(docs, /src\/components\/settings\/tag-manager-card\.tsx/);
  assert.match(docs, /Settings\.tags/);
});
