import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

async function readSource(path) {
  return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

test("additional entry display rows stay on one line on mobile", async () => {
  const source = await readSource("src/components/monthly/additional-entries-card.tsx");

  assert.doesNotMatch(
    source,
    /flex flex-col gap-1\.5 sm:flex-row sm:items-center sm:justify-between/,
    "display rows should not stack label and amount/actions on mobile",
  );
  assert.match(
    source,
    /flex min-w-0 items-center justify-between gap-2/,
    "display rows should use a single compact horizontal row",
  );
  assert.match(
    source,
    /truncate text-left/,
    "entry labels should truncate instead of pushing amount/actions to a second line",
  );
  assert.match(
    source,
    /shrink-0 items-center/,
    "amount and action controls should keep their width in the row",
  );
});

