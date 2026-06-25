import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("monthly export route builds a single-month Markdown file", () => {
  const source = readFileSync(new URL("./route.ts", import.meta.url), "utf8");

  assert.match(source, /buildMonthlyMarkdown/);
  assert.match(source, /getSessionUser/);
  assert.match(source, /getYearData\(user\.id, yearNum\)/);
  assert.match(source, /monthNum < 1 \|\| monthNum > 12/);
  assert.match(source, /text\/markdown; charset=utf-8/);
  assert.match(source, /gridly-\$\{yearNum\}-\$\{monthName\}\.md/);
});
