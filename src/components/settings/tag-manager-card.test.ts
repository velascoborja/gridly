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

test("TagManagerCard uses elevated card and header shadow treatments", () => {
  assert.match(source, /<Card className="[^"]*gap-0[^"]*bg-primary\/\[0\.03\][^"]*py-0/);
  assert.match(source, /shadow-\[0_30px_45px_-30px_rgba\(50,50,93,0\.25\),0_18px_36px_-24px_rgba\(0,0,0,0\.1\)\]/);
  assert.match(source, /CardHeader className="[^"]*pt-5/);
  assert.match(source, /CardHeader className="[^"]*relative[^"]*z-10[^"]*shadow-\[0_18px_30px_-24px_rgba\(50,50,93,0\.45\)\]/);
  assert.doesNotMatch(source, /CardHeader className="[^"]*bg-primary\/\[0\.03\]/);
  assert.match(source, /CardContent className="[^"]*bg-background\/95[^"]*pb-5/);
});

test("TagManagerCard icon badge avoids a pale seam inside the border", () => {
  assert.match(source, /border-\[#b9b9f9\] bg-\[#dbe8ff\]/);
  assert.doesNotMatch(source, /border-primary\/15 bg-primary\/10/);
});

test("TagManagerCard rows use compact single-line controls on desktop", () => {
  assert.match(source, /sm:grid-cols-\[minmax\(7rem,12rem\)_1fr_auto\]/);
  assert.match(source, /className="h-9 rounded-lg/);
  assert.match(source, /className="flex flex-nowrap items-center justify-center gap-1\.5 sm:gap-1"/);
  assert.match(source, /"size-3\.5 rounded-full/);
  assert.match(source, /className="min-w-20 gap-1\.5"/);
  assert.doesNotMatch(source, /<div className="min-w-0 space-y-3">/);
  assert.doesNotMatch(source, /className="flex flex-wrap gap-1\.5"/);
});

test("TagManagerCard rows use a tightened stacked layout on mobile", () => {
  assert.match(
    source,
    /className="grid gap-3 rounded-xl border border-border\/70 bg-background p-3 shadow-sm transition-shadow hover:shadow-md sm:grid-cols-\[minmax\(7rem,12rem\)_1fr_auto\] sm:items-center sm:gap-2"/
  );
  assert.match(source, /<div className="min-w-0 sm:max-w-48">/);
  assert.match(source, /className="flex flex-nowrap items-center justify-center gap-1\.5 sm:gap-1"/);
  assert.match(source, /className="flex items-center justify-end gap-2"/);
  assert.match(source, /className="min-w-20 gap-1\.5"/);
  assert.doesNotMatch(source, /className="[^"]*flex-1[^"]*"/);
});
