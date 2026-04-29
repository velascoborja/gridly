import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("annual config edits sync recalculated year data to parent state", () => {
  const source = readFileSync(new URL("./annual-view.tsx", import.meta.url), "utf8");

  assert.match(source, /onYearDataChange\?: \(yearData: YearData\) => void/);
  assert.match(source, /const applyConfigToMonths = \(nextConfig: YearConfig\) => \{/);
  assert.match(source, /onYearDataChange\?\.\(\{[\s\S]*config: nextConfig,[\s\S]*months: recomputedMonths,[\s\S]*\}\)/);
});

test("annual config edits reapply setup defaults across monthly rows", () => {
  const source = readFileSync(new URL("./annual-view.tsx", import.meta.url), "utf8");
  const formSource = readFileSync(new URL("./year-config-form.tsx", import.meta.url), "utf8");

  assert.match(source, /applyYearConfigToMonth/, "annual state should reuse the setup-field overwrite helper");
  assert.match(source, /const updatedRows = current\.map\(\(month\) => applyYearConfigToMonth\(month, nextConfig\)\)/);
  assert.match(formSource, /AlertDialog/, "saving annual setup edits should warn before overwriting monthly edits");
  assert.match(formSource, /confirmOverwriteTitle/, "warning copy should be localized");
  assert.match(formSource, /t\.has\("confirmOverwriteTitle"\)/, "dialog should not render raw translation keys if the bundle is stale");
  assert.match(formSource, /¿Sobrescribir los meses\?/, "dialog should keep a Spanish fallback for the confirmation title");
});

test("year page lets annual summary update shared year data", () => {
  const source = readFileSync(new URL("../year/year-page-client.tsx", import.meta.url), "utf8");

  assert.match(source, /<AnnualView[\s\S]*onYearDataChange=\{setCurrentYearData\}/);
});

test("year page uses native history for in-year view changes without server navigation", () => {
  const source = readFileSync(new URL("../year/year-page-client.tsx", import.meta.url), "utf8");

  assert.match(source, /import \{ usePathname \} from "@\/i18n\/routing"/);
  assert.doesNotMatch(source, /useRouter/);
  assert.match(source, /window\.history\.pushState\(null, "", buildYearMonthHref\(routePrefix, currentYearData\.config\.year, nextMonth\)\)/);
  assert.match(source, /window\.history\.pushState\(null, "", buildYearSummaryHref\(routePrefix, currentYearData\.config\.year\)\)/);
  assert.match(source, /window\.history\.pushState\(null, "", buildSettingsHref\(routePrefix\)\)/);
});

test("year page syncs the selected view from pathname changes after setup navigation", () => {
  const source = readFileSync(new URL("../year/year-page-client.tsx", import.meta.url), "utf8");

  assert.match(source, /function getInitialStateFromPathname/);
  assert.match(source, /useState<YearRouteView>\(\(\) => initialState\.view\)/);
  assert.match(source, /function syncStateFromPathname\(nextPathname: string\)/);
  assert.match(source, /syncStateFromPathname\(pathname\)/);
  assert.match(source, /\}, \[currentYearData\.config\.year, pathname\]\)/);
});

test("annual config saves refresh the current route cache", () => {
  const source = readFileSync(new URL("./year-config-form.tsx", import.meta.url), "utf8");

  assert.match(source, /import \{ useRouter \} from "@\/i18n\/routing"/);
  assert.match(source, /router\.refresh\(\)/);
});

test("annual recurring expense saves refresh the current route cache", () => {
  const source = readFileSync(new URL("./year-config-form.tsx", import.meta.url), "utf8");

  assert.match(source, /const handleSaveRecurringExpenses = async \(\) => \{/);
  assert.match(
    source,
    /fetch\(`\/api\/years\/\$\{config\.year\}\/recurring-expenses`[\s\S]*router\.refresh\(\)/,
    "saving recurring expenses should refresh the summary route cache"
  );
});

test("annual recurring expense confirmation closes after a successful save", () => {
  const source = readFileSync(new URL("./year-config-form.tsx", import.meta.url), "utf8");

  assert.match(source, /const \[recurringDialogOpen, setRecurringDialogOpen\] = useState\(false\)/);
  assert.match(source, /<AlertDialog open=\{recurringDialogOpen\} onOpenChange=\{setRecurringDialogOpen\}>/);
  assert.match(
    source,
    /await savePromise;[\s\S]*setRecurringDialogOpen\(false\);[\s\S]*catch/,
    "successful recurring expense saves should close the confirmation dialog before handling failures"
  );
});

test("annual interest rate setting edits inline with percent formatting", () => {
  const source = readFileSync(new URL("./year-config-form.tsx", import.meta.url), "utf8");

  assert.doesNotMatch(source, /prompt\(/);
  assert.match(source, /label=\{t\("interestRate"\)\}/);
  assert.match(source, /formatDisplayValue=\{\(v\) => `\$\{\(v \* 100\)\.toFixed\(2\)\}%`\}/);
  assert.match(source, /formatEditValue=\{\(v\) => String\(\+\(v \* 100\)\.toFixed\(2\)\)\}/);
  assert.match(source, /parseInputValue=\{\(input\) => parseFloat\(input\.replace\(",", "\."\)\) \/ 100\}/);
});

test("annual settings can reapply recurring expense templates to every month", () => {
  const viewSource = readFileSync(new URL("./annual-view.tsx", import.meta.url), "utf8");
  const formSource = readFileSync(new URL("./year-config-form.tsx", import.meta.url), "utf8");

  assert.match(viewSource, /handleRecurringExpensesApplied/);
  assert.match(viewSource, /onRecurringExpensesApplied=\{handleRecurringExpensesApplied\}/);
  assert.match(formSource, /RecurringExpenseTemplateEditor/);
  assert.match(formSource, /AlertDialog/);
  assert.match(formSource, /\/api\/years\/\$\{config\.year\}\/recurring-expenses/);
});
