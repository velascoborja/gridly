import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("recurring expense amount inputs can show an opt-in Euro suffix as soon as they are editable", () => {
  const source = readFileSync(new URL("./recurring-expense-template-editor.tsx", import.meta.url), "utf8");

  assert.match(source, /showCurrencySuffix = false/);
  assert.match(source, />\s*€\s*<\/span>/);
  assert.match(source, /replace\(\/€\/g, ""\)/);
  assert.match(source, /pr-8/);
  const suffixBlock = source.match(/\{showCurrencySuffix \? \([\s\S]*?\) : null\}/)?.[0] ?? "";
  assert.doesNotMatch(suffixBlock, /entry\.amount !== 0/);
  assert.doesNotMatch(suffixBlock, /opacity-0/);
});
