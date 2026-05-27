import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("./route.ts", import.meta.url), "utf8");

test("tag item route requires authentication for update and delete", () => {
  assert.match(source, /getSessionUser/);
  assert.match(source, /status: 401/);
  assert.match(source, /export async function PATCH/);
  assert.match(source, /export async function DELETE/);
});

test("tag PATCH validates route id, name, and palette color", () => {
  assert.match(source, /parseTagId/);
  assert.match(source, /Invalid tag id/);
  assert.match(source, /name is required/);
  assert.match(source, /TAG_COLOR_KEYS\.includes\(color\)/);
  assert.match(source, /color must be a valid palette key/);
});

test("tag PATCH scopes updates to the authenticated user's tag", () => {
  assert.match(source, /and\(/);
  assert.match(source, /eq\(tags\.id, tagId\)/);
  assert.match(source, /eq\(tags\.userId, user\.id\)/);
  assert.match(source, /\.update\(tags\)/);
  assert.match(source, /\.returning\(\)/);
  assert.match(source, /Tag not found/);
});

test("tag DELETE deletes only the authenticated user's tag and relies on set-null foreign keys", () => {
  assert.match(source, /\.delete\(tags\)/);
  assert.match(source, /eq\(tags\.id, tagId\)/);
  assert.match(source, /eq\(tags\.userId, user\.id\)/);
  assert.doesNotMatch(source, /delete\(additionalEntries\)/);
  assert.doesNotMatch(source, /delete\(additionalEntryGroups\)/);
  assert.match(source, /status: 204/);
});
