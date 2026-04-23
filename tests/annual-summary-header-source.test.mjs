import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

async function readSource(path) {
  return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

test("annual close card owns the page header actions", async () => {
  const annualView = await readSource("src/components/annual/annual-view.tsx");
  const kpiCards = await readSource("src/components/annual/kpi-cards.tsx");

  assert.match(kpiCards, /YearConfigForm/, "annual close card should own the configuration dialog");
  assert.match(kpiCards, /Download/, "annual close card should own the export action");
  assert.match(kpiCards, /Settings/, "annual close card should own the settings action");
  assert.match(kpiCards, /yearLabel/, "annual close card should render the selected exercise");
  assert.match(kpiCards, /exportExcel/, "annual close card should render the export label");

  assert.doesNotMatch(
    annualView,
    /bg-gradient-to-br from-\[#1c1e54\]/,
    "AnnualView should not render the old standalone dark header",
  );
  assert.doesNotMatch(annualView, /<Dialog>/, "AnnualView should delegate the settings dialog to the close card");
  assert.doesNotMatch(annualView, /<Download/, "AnnualView should delegate the export icon to the close card");
});
