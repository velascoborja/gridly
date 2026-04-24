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

test("year update source accepts starting balance edits only for the earliest year and propagates changes", async () => {
  const source = await readSource("src/app/api/years/[year]/route.ts");

  assert.match(source, /body\.startingBalance/, "year update route should accept startingBalance for editable first years");
  assert.match(source, /earliestYear !== yearNum/, "year update route should reject startingBalance edits outside the earliest year");
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
  const monthPageSource = await readSource("src/app/[locale]/[year]/[month]/page.tsx");
  const navSource = await readSource("src/components/layout/nav-selectors.tsx");

  assert.match(setupSource, /derivedStartingBalance/, "setup should load and display the derived carry-over balance");
  assert.match(setupSource, /body\.startingBalance/, "setup should submit the editable first-year starting balance");
  assert.match(setupSource, /t\("descriptionFixed"/, "setup should explain the sequential year rule");
  assert.match(monthPageSource, /redirect\(`\/setup\/\$\{year\}\?redirect=\/\$\{year\}\/\$\{month\}`\)/, "missing first-year route should redirect into setup");
  assert.match(navSource, /Plus/, "nav selector should render a plus icon for year creation");
  assert.match(navSource, /aria-label=\{t\("createYear"/, "nav selector should keep an accessible label for the icon-only create button");
  assert.doesNotMatch(navSource, />\s*Crear \{nextCreatableYear\}\s*</, "nav selector should no longer show a text create-year button");
});

test("year config source offers starting balance editing when the year is editable", async () => {
  const source = await readSource("src/components/annual/year-config-form.tsx");

  assert.match(source, /startingBalanceEditable/, "year config form should receive the editable first-year state");
  assert.match(source, /onSave=\{\(v\) => handleSave\("startingBalance", v\)\}/, "year config form should save startingBalance when editable");
  assert.match(source, /disabled=\{!startingBalanceEditable\}/, "year config form should disable startingBalance editing for carried-over years");
});
