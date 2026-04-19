import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

async function readSource(path) {
  return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

test("year creation source enforces sequential creation and derived carry-over", async () => {
  const source = await readSource("src/app/api/years/route.ts");

  assert.match(source, /latestYear/, "create year route should look up the latest existing year");
  assert.match(source, /Only the next year can be created/, "create year route should reject non-sequential requests");
  assert.match(source, /deriveStartingBalance/, "create year route should derive the next starting balance from prior data");
  assert.match(source, /propagateYearCarryOver/, "create year route should propagate carry-over after creation");
});

test("year update source no longer accepts direct starting balance edits and propagates changes", async () => {
  const source = await readSource("src/app/api/years/[year]/route.ts");

  assert.doesNotMatch(source, /body\.startingBalance/, "year update route should not patch startingBalance directly");
  assert.match(source, /propagateYearCarryOver/, "year update route should propagate downstream years after config changes");
});

test("month and additional entry mutations propagate future year balances", async () => {
  const monthSource = await readSource("src/app/api/months/[monthId]/route.ts");
  const createEntrySource = await readSource("src/app/api/months/[monthId]/entries/route.ts");
  const entrySource = await readSource("src/app/api/months/[monthId]/entries/[entryId]/route.ts");

  assert.match(monthSource, /propagateYearCarryOver/, "month updates should propagate downstream years");
  assert.match(createEntrySource, /propagateYearCarryOver/, "entry creation should propagate downstream years");
  assert.match(entrySource, /propagateYearCarryOver/, "entry edits and deletes should propagate downstream years");
});

test("setup and monthly entrypoints expose only guided next-year creation", async () => {
  const setupSource = await readSource("src/components/setup/setup-page-client.tsx");
  const monthPageSource = await readSource("src/app/[year]/[month]/page.tsx");
  const navSource = await readSource("src/components/layout/nav-selectors.tsx");

  assert.match(setupSource, /derivedStartingBalance/, "setup should load and display the derived carry-over balance");
  assert.match(setupSource, /Solo puedes crear el siguiente ejercicio/, "setup should explain the sequential year rule");
  assert.match(monthPageSource, /nextCreatableYear/, "missing-year screen should compute the next allowed year");
  assert.match(monthPageSource, /Crear \{nextCreatableYear\}/, "missing-year screen should point to the next allowed year only");
  assert.match(navSource, /Plus/, "nav selector should render a plus icon for year creation");
  assert.match(navSource, /aria-label=\{`Crear \$\{nextCreatableYear\}`\}/, "nav selector should keep an accessible label for the icon-only create button");
  assert.doesNotMatch(navSource, />\s*Crear \{nextCreatableYear\}\s*</, "nav selector should no longer show a text create-year button");
});

test("year config source no longer offers editing the starting balance field", async () => {
  const source = await readSource("src/components/annual/year-config-form.tsx");

  assert.doesNotMatch(source, /label=\"Saldo inicial del año\"/, "year config form should not render inline editing for startingBalance");
  assert.match(source, /Saldo inicial vinculado/, "year config form should explain that starting balance is linked");
});
