import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("month overview exposes monthly Markdown export for editable months", () => {
  const source = readFileSync(new URL("./month-overview.tsx", import.meta.url), "utf8");

  assert.match(source, /Download/);
  assert.match(source, /handleExportMonth/);
  assert.match(source, /\/api\/years\/\$\{config\.year\}\/months\/\$\{month\.month\}\/export/);
  assert.match(source, /!readOnly \?/);
  assert.match(source, /exportMonthAria/);
});

test("month overview exposes projected year-end balance beside the month status", () => {
  const source = readFileSync(new URL("./month-overview.tsx", import.meta.url), "utf8");

  assert.match(source, /yearEndMonth = sortedMonths\.find\(\(item\) => item\.month === 12\)/);
  assert.match(source, /shouldShowYearEndBalance = Boolean\(yearEndMonth && month\?\.month !== 12\)/);
  assert.match(source, /shouldShowYearEndBalance && yearEndMonth/);
  assert.match(source, /sm:flex-row sm:justify-center lg:justify-start/);
  assert.match(source, /normal-case tracking-normal text-white\/45/);
  assert.match(source, /hidden text-white\/25 sm:inline/);
  assert.match(source, /yearEndBalanceInline/);
  assert.match(source, /yearEndBalanceAria/);
  assert.match(source, /yearEndMonth\.endingBalance/);
});

test("month overview opens fixed values in a bottom sheet on mobile", () => {
  const source = readFileSync(new URL("./month-overview.tsx", import.meta.url), "utf8");

  assert.match(source, /MOBILE_FIXED_SHEET_QUERY = "\(max-width: 767px\)"/);
  assert.match(source, /useSyncExternalStore/);
  assert.match(source, /renderFixedEditors && !usesFixedValuesSheet/);
  assert.match(source, /<Sheet open=\{fixedSheetOpen\} onOpenChange=\{setFixedSheetOpen\}>/);
  assert.match(source, /aria-haspopup=\{usesFixedValuesSheet \? "dialog" : undefined\}/);
  assert.match(source, /toggleFixedEditorsRef\.current = toggleFixedValues/);
  assert.match(source, /\[role='dialog'\]/);
  assert.match(source, /fixedSheetTitle/);
});
