import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("create year navigation derives its redirect from the current browser path", () => {
  const source = readFileSync(new URL("./nav-selectors.tsx", import.meta.url), "utf8");

  assert.match(source, /buildSetupHrefFromPathname/);
  assert.match(source, /const pathname = usePathname\(\)/);
  assert.match(source, /const createYearHref = buildSetupHrefFromPathname\(nextCreatableYear, pathname/);
});
