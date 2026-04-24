import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

async function readSource(path) {
  return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

test("annual config editing keeps a setter-compatible prop contract", async () => {
  const kpiCardsSource = await readSource("src/components/annual/kpi-cards.tsx");
  const yearConfigFormSource = await readSource("src/components/annual/year-config-form.tsx");
  const annualViewSource = await readSource("src/components/annual/annual-view.tsx");

  assert.match(
    yearConfigFormSource,
    /onConfigChange:\s*Dispatch<SetStateAction<YearConfig>>;/,
    "YearConfigForm should accept a setter-compatible config callback",
  );
  assert.match(
    kpiCardsSource,
    /onConfigChange:\s*Dispatch<SetStateAction<YearConfig>>;/,
    "KpiCards should forward a setter-compatible config callback to YearConfigForm",
  );
  assert.match(
    annualViewSource,
    /onConfigChange=\{setConfig\}/,
    "AnnualView should pass the state setter through to the KPI cards",
  );
});

test("annual extra payment toggle exposes pending feedback and animated details", async () => {
  const source = await readSource("src/components/annual/year-config-form.tsx");

  assert.match(source, /savingFields/, "extra payment toggle should track pending save state");
  assert.match(source, /Loader2/, "extra payment toggle should render a visible loading indicator");
  assert.match(source, /disabled=\{isSavingField\("hasExtraPayments"\)\}/, "extra payment toggle should prevent duplicate saves while pending");
  assert.match(source, /grid-rows-\[1fr\]/, "extra payment amount field should animate open");
  assert.match(source, /grid-rows-\[0fr\]/, "extra payment amount field should animate closed");
});
