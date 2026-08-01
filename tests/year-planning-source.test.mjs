import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

async function readSource(path) {
  return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

test("year creation source enforces sequential creation and derived carry-over", async () => {
  const source = await readSource("src/lib/server/actions/years.ts");

  assert.match(source, /latestYear/, "create year action should look up the latest existing year");
  assert.match(source, /Only the next year can be created/, "create year action should reject non-sequential requests");
  assert.match(source, /deriveStartingBalance/, "create year action should derive the next starting balance from prior data");
  assert.match(source, /propagateYearCarryOver\(user\.id, latestYear \?\? data\.year\)/, "create year action should repair from the predecessor after creation");
  assert.doesNotMatch(source, /finalStartingBalance === 0/, "later-year creation must not trust a client zero check");
  assert.match(source, /Previous year data is required/, "later-year creation must not fall back to a client balance when predecessor data is unavailable");
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
  const prefillSource = await readSource("src/app/api/years/[year]/prefill/route.ts");

  assert.match(monthSource, /propagateYearCarryOver/, "month updates should propagate downstream years");
  assert.match(createEntrySource, /propagateYearCarryOver/, "entry creation should propagate downstream years");
  assert.match(entrySource, /propagateYearCarryOver/, "entry edits and deletes should propagate downstream years");
  assert.match(prefillSource, /propagateYearCarryOver\(user\.id, yearNum\)/, "year prefill should propagate its recreated months downstream");
});

test("API year creation derives and repairs from the latest predecessor", async () => {
  const source = await readSource("src/app/api/years/route.ts");

  assert.match(source, /derivedStartingBalance = deriveStartingBalance\(previousYearData\)/);
  assert.match(source, /propagateYearCarryOver\(user\.id, latestYear \?\? year\)/);
});

test("carry-over propagation uses versioned compare-and-set updates and retries", async () => {
  const source = await readSource("src/lib/server/year-carry-over.ts");

  assert.match(source, /carryOverVersion/);
  assert.match(source, /predecessorVersionMatches/);
  assert.match(source, /propagateVersionedCarryOver/);
});

test("setup and monthly entrypoints expose only guided next-year creation", async () => {
  const setupSource = await readSource("src/components/setup/setup-page-client.tsx");
  const monthPageSource = await readSource("src/app/[locale]/[year]/[month]/page.tsx");
  const navSource = await readSource("src/components/layout/nav-selectors.tsx");

  assert.match(setupSource, /derivedStartingBalance/, "setup should load and display the derived carry-over balance");
  assert.match(setupSource, /startingBalance: parseNumber\(values\.startingBalance\)/, "setup should submit the editable first-year starting balance");
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

test("month route passes starting balance editability into the shared year shell", async () => {
  const source = await readSource("src/app/[locale]/[year]/[month]/page.tsx");

  assert.match(source, /const startingBalanceEditable = years\[0\] === year;/, "month route should derive the same editable first-year state as summary");
  assert.match(source, /startingBalanceEditable=\{startingBalanceEditable\}/, "month route should pass editability into the shared year shell");
});
