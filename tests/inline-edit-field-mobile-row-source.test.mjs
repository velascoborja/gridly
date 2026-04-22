import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

async function readSource(path) {
  return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

test("inline edit fields keep label and amount on one line on mobile", async () => {
  const source = await readSource("src/components/monthly/inline-edit-field.tsx");

  assert.doesNotMatch(
    source,
    /flex flex-col gap-1\.5[^"]*sm:flex-row/,
    "fixed income and expense rows should not stack label and amount on mobile",
  );
  assert.match(
    source,
    /grid-cols-\[minmax\(0,1fr\)_auto\]/,
    "field rows should reserve flexible label space and fixed amount/actions space",
  );
  assert.match(
    source,
    /truncate[^"]*whitespace-nowrap|whitespace-nowrap[^"]*truncate/,
    "labels should remain one line and truncate instead of wrapping",
  );
  assert.match(
    source,
    /shrink-0/,
    "amount and edit controls should keep their compact width in the row",
  );
});
