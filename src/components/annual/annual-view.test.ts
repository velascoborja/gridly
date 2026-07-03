import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("annual config edits sync recalculated year data to parent state", () => {
  const source = readFileSync(new URL("./annual-view.tsx", import.meta.url), "utf8");

  assert.match(source, /onYearDataChange\?: \(yearData: YearData\) => void/);
  assert.match(source, /const applyConfigToMonths = \(nextConfig: YearConfig, applyFromMonth: number\) => \{/);
  assert.match(source, /onYearDataChange\?\.\(\{[\s\S]*config: nextConfig,[\s\S]*months: recomputedMonths,[\s\S]*\}\)/);
});

test("annual config edits reapply setup defaults across monthly rows", () => {
  const source = readFileSync(new URL("./annual-view.tsx", import.meta.url), "utf8");
  const formSource = readFileSync(new URL("./year-config-form.tsx", import.meta.url), "utf8");

  assert.match(source, /applyYearConfigToMonth/, "annual state should reuse the setup-field overwrite helper");
  assert.match(source, /const updatedRows = current\.map\(\(month\) => applyYearConfigToMonth\(month, nextConfig, applyFromMonth\)\)/);
  assert.match(formSource, /AlertDialog/, "saving annual setup edits should warn before overwriting monthly edits");
  assert.match(formSource, /confirmOverwriteTitle/, "warning copy should be localized");
  assert.match(formSource, /t\.has\("confirmOverwriteTitle"\)/, "dialog should not render raw translation keys if the bundle is stale");
  assert.match(formSource, /¿Sobrescribir los meses\?/, "dialog should keep a Spanish fallback for the confirmation title");
});

test("annual setup dialog exposes one apply-from month selector for setup and recurring overwrites", () => {
  const formSource = readFileSync(new URL("./year-config-form.tsx", import.meta.url), "utf8");
  const yearRouteSource = readFileSync(new URL("../../app/api/years/[year]/route.ts", import.meta.url), "utf8");
  const recurringRouteSource = readFileSync(
    new URL("../../app/api/years/[year]/recurring-expenses/route.ts", import.meta.url),
    "utf8"
  );

  assert.match(formSource, /const \[applyFromMonth, setApplyFromMonth\] = useState\(1\)/);
  assert.match(formSource, /applyFromMonthLabel/);
  assert.match(formSource, /<Select[\s\S]*value=\{String\(applyFromMonth\)\}[\s\S]*items=\{monthOptions\}/);
  assert.match(formSource, /body: JSON\.stringify\(\{ \[field\]: value, applyFromMonth \}\)/);
  assert.match(formSource, /body: JSON\.stringify\(\{ recurringExpenses: recurringDraft, applyFromMonth \}\)/);
  assert.match(formSource, /onConfigApplied\?: \(config: YearConfig, applyFromMonth: number\) => void/);
  assert.match(yearRouteSource, /const applyFromMonth = parseApplyFromMonth\(body\.applyFromMonth\)/);
  assert.match(recurringRouteSource, /const applyFromMonth = parseApplyFromMonth\(body\.applyFromMonth\)/);
  assert.match(recurringRouteSource, /month\.month >= applyFromMonth/);
});

test("year page lets annual summary update shared year data", () => {
  const source = readFileSync(new URL("../year/year-page-client.tsx", import.meta.url), "utf8");

  assert.match(source, /<AnnualView[\s\S]*onYearDataChange=\{setCurrentYearData\}/);
});

test("year pages pass annual KPI comparison context from evolution metrics", () => {
  const summarySource = readFileSync(new URL("../../app/[locale]/[year]/summary/page.tsx", import.meta.url), "utf8");
  const monthSource = readFileSync(new URL("../../app/[locale]/[year]/[month]/page.tsx", import.meta.url), "utf8");
  const yearClientSource = readFileSync(new URL("../year/year-page-client.tsx", import.meta.url), "utf8");
  const annualSource = readFileSync(new URL("./annual-view.tsx", import.meta.url), "utf8");

  assert.match(summarySource, /getEvolutionSourcesForUser/);
  assert.match(summarySource, /deriveAnnualKpiComparison\(deriveEvolutionMetrics\(evolutionSources\), year\)/);
  assert.match(summarySource, /annualComparison=\{annualComparison\}/);
  assert.match(monthSource, /getEvolutionSourcesForUser/);
  assert.match(monthSource, /deriveAnnualKpiComparison\(deriveEvolutionMetrics\(evolutionSources\), year\)/);
  assert.match(monthSource, /annualComparison=\{annualComparison\}/);
  assert.match(yearClientSource, /annualComparison\?: AnnualKpiComparisonData/);
  assert.match(yearClientSource, /<AnnualView[\s\S]*annualComparison=\{annualComparison\}/);
  assert.match(annualSource, /annualComparison\?: AnnualKpiComparisonData/);
  assert.match(annualSource, /<KpiCards[\s\S]*annualComparison=\{annualComparison\}/);
});

test("year route has a dedicated loading skeleton inside the app shell", () => {
  const source = readFileSync(new URL("../../app/[locale]/[year]/loading.tsx", import.meta.url), "utf8");

  assert.match(source, /BaseAppShell/);
  assert.match(source, /aria-busy="true"/);
  assert.match(source, /surface-depth-floating/);
  assert.match(source, /xl:grid-cols-\[minmax\(0,1\.6fr\)_minmax\(18rem,0\.85fr\)\]/);
  assert.match(source, /md:grid-cols-2/);
  assert.match(source, /ChartSkeleton/);
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

test("annual setup form groups fields into sorted financial sections", () => {
  const formSource = readFileSync(new URL("./year-config-form.tsx", import.meta.url), "utf8");

  const startingIndex = formSource.indexOf('t("sectionStartingPoint")');
  const applyFromIndex = formSource.indexOf('t("applyFromMonthLabel")');
  const incomeIndex = formSource.indexOf('t("sectionIncome")');
  const allocationIndex = formSource.indexOf('t("sectionMonthlyAllocation")');
  const growthIndex = formSource.indexOf('t("sectionGrowth")');
  const recurringIndex = formSource.indexOf('t("recurringExpensesTitle")');

  assert.ok(startingIndex > -1, "starting point section should be rendered");
  assert.ok(applyFromIndex > startingIndex, "apply-from scope should follow starting point");
  assert.ok(incomeIndex > applyFromIndex, "income should follow the apply-from scope");
  assert.ok(allocationIndex > incomeIndex, "monthly allocation should follow income");
  assert.ok(growthIndex > allocationIndex, "growth assumptions should follow monthly allocation");
  assert.ok(recurringIndex > growthIndex, "recurring expenses editor should follow setup sections");
  assert.match(formSource, /lg:grid-cols-2/, "income and monthly allocation should pair on larger screens");
  assert.match(formSource, /t\("overwriteBadge", \{ month: selectedApplyFromMonthLabel \}\)/, "the form should show a visible overwrite impact badge");
  assert.match(formSource, /t\("startingBalanceScopeBadge"\)/, "starting balance should be labeled as an annual-chain value");
});

test("annual setup dialog has room for the grouped desktop layout", () => {
  const source = readFileSync(new URL("./kpi-cards.tsx", import.meta.url), "utf8");
  const formSource = readFileSync(new URL("./year-config-form.tsx", import.meta.url), "utf8");

  assert.match(source, /DialogContent className="[^"]*sm:max-w-3xl/, "config dialog should override the default narrow desktop max width");
  assert.match(formSource, /items-stretch gap-3 lg:grid-cols-2/, "paired desktop setup cards should match the tallest card height");
});

test("KPI cards render expected entries dialog trigger and annotation lines", () => {
  const source = readFileSync(new URL("./kpi-cards.tsx", import.meta.url), "utf8");

  assert.match(source, /ExpectedEntriesDialog/, "should import and render ExpectedEntriesDialog");
  assert.match(source, /Sparkles/, "should use Sparkles icon for the trigger button");
  assert.match(source, /expectedEntriesButton/, "trigger button should have a localized sr-only label");
  assert.match(source, /expectedIncome:/, "should accept expectedIncome prop");
  assert.match(source, /expectedExpenses:/, "should accept expectedExpenses prop");
  assert.match(source, /onAddExpectedEntry:/, "should accept onAddExpectedEntry prop");
  assert.match(source, /onDeleteExpectedEntry:/, "should accept onDeleteExpectedEntry prop");
  assert.match(source, /expectedIncomeAnnotation/, "should render expectedIncomeAnnotation translation key");
  assert.match(source, /expectedExpensesAnnotation/, "should render expectedExpensesAnnotation translation key");
});

test("KPI cards render annual comparison translation lines", () => {
  const source = readFileSync(new URL("./kpi-cards.tsx", import.meta.url), "utf8");

  assert.match(source, /annualComparison\?: AnnualKpiComparisonData/);
  assert.match(source, /savingsVsPreviousYear/);
  assert.match(source, /savingsVsAverage/);
  assert.match(source, /balanceVsPreviousYear/);
  assert.match(source, /formatSignedCurrency/);
  assert.match(source, /formatSignedPercent/);
});

test("annual KPI cards show total interest earned", () => {
  const source = readFileSync(new URL("./kpi-cards.tsx", import.meta.url), "utf8");
  assert.match(source, /m\.interests/, "should sum monthly interest");
  assert.match(source, /t\("interestEarned"\)/, "should render an interest KPI card");
});

test("balance chart zooms the Y axis around the annual balance range", () => {
  const source = readFileSync(new URL("./balance-chart.tsx", import.meta.url), "utf8");

  assert.match(source, /export function getBalanceYAxisDomain\(values: number\[\]\): \[number, number\]/);
  assert.match(source, /const yAxisDomain = getBalanceYAxisDomain\(data\.map\(\(m\) => m\.saldo\)\)/);
  assert.match(source, /domain=\{yAxisDomain\}/);
});

test("balance chart highlights only the current month dot by viewed year", () => {
  const source = readFileSync(new URL("./balance-chart.tsx", import.meta.url), "utf8");
  const annualSource = readFileSync(new URL("./annual-view.tsx", import.meta.url), "utf8");

  assert.match(annualSource, /<BalanceChart months=\{months\} year=\{config\.year\} \/>/);
  assert.match(source, /year: number/);
  assert.match(source, /export function isCurrentChartMonth\(year: number, month: number, now = new Date\(\)\)/);
  assert.match(source, /isCurrentMonth: isCurrentChartMonth\(year, m\.month, now\)/);
  assert.match(source, /function BalanceDot/);
  assert.match(source, /function CurrentMonthAxisTick/);
  assert.match(source, /<animate attributeName="r"/);
  assert.match(source, /<animate attributeName="opacity"/);
  assert.match(source, /dot=\{<BalanceDot \/>}/);
  assert.match(source, /const currentMonthName = data\.find\(\(m\) => m\.isCurrentMonth\)\?\.name/);
  assert.match(source, /tick=\{\(props\) => <CurrentMonthAxisTick \{\.\.\.props\} currentMonthName=\{currentMonthName\} \/>}/);
  assert.match(source, /name=\{t\("balanceLabel"\)\}/);
  assert.doesNotMatch(source, /pastSaldo/);
  assert.doesNotMatch(source, /futureSaldo/);
});

test("savings chart highlights the current month bar by viewed year", () => {
  const source = readFileSync(new URL("./savings-chart.tsx", import.meta.url), "utf8");
  const annualSource = readFileSync(new URL("./annual-view.tsx", import.meta.url), "utf8");
  const esMessages = readFileSync(new URL("../../../messages/es.json", import.meta.url), "utf8");
  const enMessages = readFileSync(new URL("../../../messages/en.json", import.meta.url), "utf8");

  assert.match(annualSource, /<SavingsChart months=\{months\} year=\{config\.year\} \/>/);
  assert.match(source, /year: number/);
  assert.match(source, /export function isCurrentSavingsChartMonth\(year: number, month: number, now = new Date\(\)\)/);
  assert.match(source, /isCurrentMonth: isCurrentSavingsChartMonth\(year, m\.month, now\)/);
  assert.match(source, /function SavingsBarShape/);
  assert.match(source, /function CurrentMonthAxisTick/);
  assert.match(source, /shape=\{<SavingsBarShape \/>}/);
  assert.match(source, /const currentMonthName = data\.find\(\(m\) => m\.isCurrentMonth\)\?\.name/);
  assert.match(source, /tick=\{\(props\) => <CurrentMonthAxisTick \{\.\.\.props\} currentMonthName=\{currentMonthName\} \/>}/);
  assert.match(source, /stroke="var\(--color-primary\)"/);
  assert.match(source, /t\("currentMonthLabel"\)/);
  assert.match(esMessages, /"currentMonthLabel": "Mes actual"/);
  assert.match(enMessages, /"currentMonthLabel": "Current month"/);
});

test("annual view reads expected entries from localStorage on mount", () => {
  const source = readFileSync(new URL("./annual-view.tsx", import.meta.url), "utf8");

  assert.match(source, /expected_entries_\$\{/, "storage key should be scoped to the year");
  assert.match(source, /localStorage\.getItem/, "should read from localStorage on mount");
  assert.match(source, /localStorage\.setItem/, "should write to localStorage on mutation");
  assert.match(source, /expectedIncome/, "should derive expectedIncome total");
  assert.match(source, /expectedExpenses/, "should derive expectedExpenses total");
  assert.match(source, /onAddExpectedEntry/, "should pass add handler to KpiCards");
  assert.match(source, /onDeleteExpectedEntry/, "should pass delete handler to KpiCards");
});

test("expected entries dialog renders a list and an add form", () => {
  const source = readFileSync(new URL("./expected-entries-dialog.tsx", import.meta.url), "utf8");

  assert.match(source, /export interface ExpectedEntry \{/, "should export the ExpectedEntry type");
  assert.match(source, /id: string/, "entry should have a string id");
  assert.match(source, /type: "income" \| "expense"/, "entry type should be a union");
  assert.match(source, /onAdd:/, "dialog should accept an onAdd callback");
  assert.match(source, /onDelete:/, "dialog should accept an onDelete callback");
  assert.match(source, /entries\.length === 0/, "should render an empty state branch");
  assert.match(source, /expectedEntriesEmptyTitle/, "empty state should make the empty condition explicit");
  assert.match(source, /t\("expectedEntriesEmptyState"\)/, "empty state should explain that new entries appear there");
  assert.match(source, /expectedEntriesEmptyAction/, "empty state should point users to the add form");
  assert.doesNotMatch(source, /labelW: "w-/, "empty state should not render placeholder row widths");
  assert.doesNotMatch(source, /bg-muted-foreground\/15/, "empty state should not render muted placeholder bars");
  assert.match(source, /t\("expectedEntryAddButton"\)/, "should render an add button");
});
