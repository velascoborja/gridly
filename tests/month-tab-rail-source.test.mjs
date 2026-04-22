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

test("month tab rail reserves mobile edge space around arrow controls", async () => {
  const source = await readSource("src/components/monthly/month-overview.tsx");

  assert.match(
    source,
    /scroll-px-3/,
    "month tab rail should use scroll padding so snapped tabs do not tuck beneath the arrow controls",
  );
  assert.match(
    source,
    /px-3 sm:px-1/,
    "month tab list should include mobile-only horizontal inset space before the first and after the last tab",
  );
  assert.match(
    source,
    /mask-image:linear-gradient/,
    "month tab rail should fade clipped edges instead of showing abruptly cropped tabs next to arrows",
  );
});
