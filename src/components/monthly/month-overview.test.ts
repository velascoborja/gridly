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
