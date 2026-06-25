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
