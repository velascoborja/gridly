import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

async function readSource(path) {
  return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

test("month tab rail keeps earlier months reachable on mobile", async () => {
  const source = await readSource("src/components/monthly/month-overview.tsx");

  assert.doesNotMatch(
    source,
    /flex min-w-full justify-center gap-2/,
    "scrollable month tabs should not center overflowing content from the scroll origin",
  );
  assert.match(
    source,
    /overflow-x-auto[^"]*snap-x/,
    "month tab rail should expose native horizontal snap scrolling",
  );
  assert.match(
    source,
    /activeMonthTabRef/,
    "active month tab should have a ref for initial scroll positioning",
  );
  assert.match(
    source,
    /scrollIntoView\(\{[^}]*inline: "center"/s,
    "active month tab should be centered in the rail when possible",
  );
});
