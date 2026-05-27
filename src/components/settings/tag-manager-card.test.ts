import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("./tag-manager-card.tsx", import.meta.url), "utf8");
const esMessages = readFileSync(new URL("../../../messages/es.json", import.meta.url), "utf8");
const enMessages = readFileSync(new URL("../../../messages/en.json", import.meta.url), "utf8");

test("TagManagerCard is a localized client component with tag palette controls", () => {
  assert.match(source, /"use client"/);
  assert.match(source, /useTranslations\("Settings\.tags"\)/);
  assert.match(source, /TAG_COLOR_KEYS\.map/);
  assert.match(source, /TAG_COLORS\[colorKey\]\.text/);
  assert.match(source, /TagIcon/);
});

test("TagManagerCard fetches tags and keeps row drafts separate from persisted tags", () => {
  assert.match(source, /fetch\("\/api\/tags"\)/);
  assert.match(source, /useState<Record<number, TagDraft>>/);
  assert.match(source, /createDrafts/);
  assert.match(source, /setDrafts\(createDrafts\(payload\)\)/);
});

test("TagManagerCard saves valid changed rows through PATCH", () => {
  assert.match(source, /hasTagChanged/);
  assert.match(source, /draft\.name\.trim\(\)\.length > 0/);
  assert.match(source, /method: "PATCH"/);
  assert.match(source, /`\/api\/tags\/\$\{tag\.id\}`/);
  assert.match(source, /setSavingTagId\(tag\.id\)/);
});

test("TagManagerCard confirms and deletes tags through DELETE", () => {
  assert.match(source, /deleteCandidate/);
  assert.match(source, /method: "DELETE"/);
  assert.match(source, /AlertDialog/);
  assert.match(source, /deleteConfirmDescription/);
  assert.match(source, /setTags\(\(current\) => current\.filter/);
});

test("TagManagerCard translations exist in Spanish and English", () => {
  assert.match(esMessages, /"tags":/);
  assert.match(enMessages, /"tags":/);
  assert.match(esMessages, /"title": "Etiquetas"/);
  assert.match(enMessages, /"title": "Tags"/);
  assert.match(esMessages, /"deleteConfirmDescription":/);
  assert.match(enMessages, /"deleteConfirmDescription":/);
});
