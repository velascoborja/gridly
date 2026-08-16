import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("./year-page-client.tsx", import.meta.url), "utf8");
const loadingSource = readFileSync(new URL("./year-view-loading.tsx", import.meta.url), "utf8");

test("year views load from separate client chunks", () => {
  assert.match(source, /import dynamic from "next\/dynamic"/);
  assert.doesNotMatch(source, /import \{ AnnualView \} from/);
  assert.doesNotMatch(source, /import \{ MonthOverview \} from/);
  assert.doesNotMatch(source, /import \{ SettingsForm \} from/);
  assert.match(source, /dynamic\([\s\S]*import\("@\/components\/annual\/annual-view"\)[\s\S]*module\.AnnualView/);
  assert.match(source, /dynamic\([\s\S]*import\("@\/components\/monthly\/month-overview"\)[\s\S]*module\.MonthOverview/);
  assert.match(source, /dynamic\([\s\S]*import\("@\/components\/settings\/settings-form"\)[\s\S]*module\.SettingsForm/);
  assert.doesNotMatch(source, /ssr:\s*false/, "direct routes should keep server rendering enabled");
});

test("every deferred year view has immediate accessible loading feedback", () => {
  assert.match(source, /loading: \(\) => <YearViewLoading view="summary" \/>/);
  assert.match(source, /loading: \(\) => <YearViewLoading view="overview" \/>/);
  assert.match(source, /loading: \(\) => <YearViewLoading view="settings" \/>/);
  assert.match(loadingSource, /aria-busy="true"/);
  assert.match(loadingSource, /aria-live="polite"/);
  assert.match(loadingSource, /motion-reduce:/);
});
