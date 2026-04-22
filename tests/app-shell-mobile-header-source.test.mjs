import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

async function readSource(path) {
  return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

test("app shell header keeps the mobile sticky area compact", async () => {
  const source = await readSource("src/components/layout/app-shell.tsx");

  assert.match(source, /grid-cols-\[1fr_auto\]/, "mobile header should use a compact two-column grid");
  assert.match(source, /py-2/, "mobile header should use compact vertical padding");
  assert.match(source, /md:py-4/, "desktop header should retain its larger vertical padding");
  assert.match(source, /className="[^"]*size-9[^"]*md:size-\[52px\]/, "mobile logo should render smaller than desktop");
  assert.match(source, /col-span-2[^"]*md:col-span-1/, "mobile navigation should sit in a single compact second row");
});

test("nav selectors stay horizontal on mobile", async () => {
  const source = await readSource("src/components/layout/nav-selectors.tsx");

  assert.match(source, /flex-wrap/, "mobile selector controls should wrap horizontally instead of stacking vertically");
  assert.doesNotMatch(source, /flex flex-col items-center gap-3 md:flex-row/, "mobile selector controls should not force a vertical stack");
  assert.match(source, /px-3[^"]*sm:px-4/, "mobile view tabs should use tighter padding than larger screens");
});

