# Feature: Evolution Dashboard

The Evolution Dashboard is the read-only multi-year analytics view for Gridly. In Spanish UI it appears as `Evolución`.

## Navigation

The main navigation shows `Meses`, `Año`, and `Evolución`.

`Evolución` is always visible and enabled for authenticated users with a configured Gridly year. This is intentional even when there is only one full year, because the Evolution screen is where users can add summary-only historical imports.

The tab links to `/{locale}/evolution`. The year selector is hidden on this route. The dashboard compares all eligible Evolution sources up to the current calendar year by default. A session-only "Include future years" toggle in the dashboard header reveals configured future years when they exist; it resets to off on every page visit and is hidden when no future years are configured.

## Data Loading

The route loads all configured years and all historical imports for the authenticated user on the server, without a calendar-year cap. Future configured years are included in the data but hidden by default in the dashboard. The client applies a `year <= calendarYear` filter unless the user explicitly enables the "Include future years" toggle. The route derives compact dashboard metrics from normalized Evolution sources and does not reuse `YearPageClient`, which is scoped to a single selected year.

If the computed metrics result in fewer than two years, the route still renders. The client dashboard shows an empty state with the historical import action so single-year users can add pre-Gridly history from the same screen.

## Computation Layer

`src/lib/evolution.ts` exports three functions:

**`deriveEvolutionMetrics(sources: EvolutionMetricSource[]): EvolutionYearMetric[]`**

Sorts Gridly and historical sources chronologically and produces one `EvolutionYearMetric` per eligible source supplied by the route. Gridly years without a December month are skipped. `accumulatedInvested` is a running total that carries forward across eligible years in chronological order.

**`summarizeEvolutionMetrics(metrics: EvolutionYearMetric[]): EvolutionSummary`**

Collapses the per-year metrics into a single summary object used by the KPI cards:

- `latestFinalBalance`: `finalBalance` of the most recent eligible year.
- `totalSaved`: sum of `savedAmount` across eligible years.
- `averageSavingsPerYear`: mean `savedAmount` across eligible years.
- `accumulatedInvested`: `accumulatedInvested` of the most recent eligible year.
- `totalWealth`: latest eligible final balance plus accumulated invested.
- `totalInterestsEarned`: sum of `interestsEarned` across eligible years.
- `bestYear`: the year with the highest `savedAmount`. `null` when there are no years.

**`calcEstimatedPortfolioValues(metrics: EvolutionYearMetric[], annualReturnRatePct: number)`**

Returns a per-year array of `{ year, estimatedPortfolioValue }`. For each year Y, `estimatedPortfolioValue` is the sum of all `investedAmount` values up to and including year Y, each compounded forward from its investment year to Y at the given annual rate: `investedAmount * (1 + rate/100)^(Y - investmentYear)`. Used when the user has entered a return rate assumption.

## Metric Definitions (`EvolutionYearMetric`)

- `source`: `gridly` for full Gridly years, `historical` for summary-only imports.
- `startingBalance`: the year's configured starting balance.
- `finalBalance`: December ending balance.
- `savedAmount`: `finalBalance - startingBalance`.
- `investedAmount`: sum of monthly `investment` for that year.
- `accumulatedInvested`: running sum of `investedAmount` up to and including that year.
- `totalIncome`: sum of monthly total income for Gridly years, or `null` for historical imports.
- `totalExpenses`: sum of monthly total expenses for Gridly years, or `null` for historical imports.
- `savingsRate`: `savedAmount / totalIncome`, or `null` when income is zero, negative, or unavailable.
- `interestsEarned`: sum of monthly `interests` for Gridly years, or the entered interest for historical imports.

Annual savings intentionally means cash balance growth. Investment remains a separate metric because Gridly counts monthly investment inside expenses.

## Historical Imports

Evolution can include both full Gridly years and summary-only historical imports. Historical imports are limited to years before the earliest full Gridly year and are intended for pre-Gridly history. They provide starting balance, final balance, and invested amount, while income, expenses, and savings rate remain unavailable.

## UI Components

| Component | File | Role |
|---|---|---|
| `EvolutionDashboard` | `evolution-dashboard.tsx` | Root client component; owns layout and calls `summarizeEvolutionMetrics` |
| `EvolutionKpiCards` | `evolution-kpi-cards.tsx` | Six summary KPI cards |
| `EvolutionCharts` | `evolution-charts.tsx` | Four charts |
| `EvolutionDetailTable` | `evolution-detail-table.tsx` | Full year-by-year data table with historical row actions |
| `HistoricalYearDialog` | `historical-year-dialog.tsx` | Add/edit form for summary-only historical imports |

### Tags Dialog

When at least one full Gridly year has tagged or untagged expense data, the dashboard header shows a Tags icon button. The button opens a dialog titled by `Evolution.categoriesTitle` that contains a **year pager** reusing the annual `TagStatRow` and `DrilldownList` UI.

The dialog opens on page 0 — a combined **"Todos los años"** landing page — and subsequent pages show one Gridly year each in ascending chronological order. Navigation uses `‹`/`›` buttons with no wraparound (arrows are disabled at the ends). The dialog resets to the "Todos" page each time it is opened.

The set of years available in the pager respects the dashboard's **"incluir futuros" (`includeFuture`) toggle**: with it off (the default), only years `<= calendarYear` appear; with it on, configured future years appear as well. Historical summary-only imports are always excluded because they do not store entry-level expense or tag data. Gridly years with `totalAdditional === 0` (no tracked spending) are skipped so there are no blank pages.

Each page shows a per-page summary line with total spend and tag count. On the "Todos" page, `DrilldownList` groups expanded entries by year; on per-year pages, it groups by month — identical to the annual Categorías view.

**Data flow**: the route passes `tagStatsByYear` — a `{ year: number; stats: TagStats }[]` array sorted ascending, one entry per Gridly year with spending — to `EvolutionDashboard`. The client merges the visible years for the combined page by calling `mergeTagStatsByYear(visibleYears)` (which attaches a `year` field to each `DrilldownEntry`). The dashboard hides the Tags button when `tagStatsByYear` is empty or absent.

Grouped expenses are attributed to the group's tag, ungrouped additional expenses use their own tag, and recurring expenses are bucketed by their recurring expense tag.

### Fixed Expenses Dialog

When at least one full Gridly year has non-zero fixed expense data, the dashboard header shows a `LayoutList` icon button. The button opens a dialog titled by `Evolution.fixedExpensesTitle` with the same **year pager** structure as the Tags dialog.

Three rows appear — home expense, personal budget, and aggregated recurring expenses — rendered using `FixedStatRow` (from `src/components/annual/fixed-stat-row.tsx`). Each row shows total, share of fixed spend, and a monthly (or cross-year) drilldown via the existing `DrilldownList` component. Rows with a zero total are omitted. Rows are sorted by total amount descending.

The set of years in the pager respects the `includeFuture` toggle. Historical summary-only imports are excluded. The dialog resets to the combined "Todos los años" page each time it is opened.

**Data flow**: `computeFixedStats` (from `src/lib/fixed-stats.ts`) runs per Gridly year on the server (`evolution/page.tsx`) and results are passed as `fixedStatsByYear: { year: number; stats: FixedExpenseStats }[]` to `EvolutionDashboard`. The client uses `mergeFixedStatsByYear` to produce the combined all-years page.

### KPI Cards

Six cards derived from `EvolutionSummary`:

1. **Latest Balance** (`latestFinalBalance`) — December ending balance of the most recent eligible year.
2. **Total Saved** (`totalSaved`) — Cumulative savings across eligible years. Value is colored green when ≥ 0, red when negative.
3. **Accumulated Investment / Estimated Portfolio** — Without a return rate: shows raw `accumulatedInvested`. When a return rate is set: shows `estimatedPortfolioValue` (compounded estimate) as the primary value, with the raw invested amount shown as a tag underneath.
4. **Average Annual Savings** (`averageSavingsPerYear`) — Mean savings across eligible years.
5. **Best Year** (`bestYear`) — The year with the highest `savedAmount`. Shows the year number as the primary value and the saved amount in the note. Displays "N/A" when undefined.
6. **Total Interest** (`totalInterestsEarned`) — Total interest earned across all eligible years.

### Investment Return Rate

The user can enter an annual return rate (%) directly in the Total Wealth box. The value is persisted in `localStorage` under the key `evolution_return_rate`. When set:

- The Total Wealth figure updates to `latestFinalBalance + estimatedPortfolioValue` (instead of raw `accumulatedInvested`).
- The wealth note changes to describe the assumed rate.
- Card 3 shows the estimated portfolio value.
- The balance chart swaps its accumulated-investment and wealth lines for estimated equivalents.

### Charts

1. **Final Balance (LineChart)** — Year-over-year trend. Without a return rate: three lines — `finalBalance` (primary), `accumulatedInvested` (teal, dashed), `totalWealth` (orange, dotted). With a return rate: `finalBalance` (primary), `estimatedPortfolioValue` (teal, dashed), `estimatedTotalWealth` (orange, dotted). A legend labels each line.
2. **Savings per Year (ComposedChart)** — `savedAmount` per year (left Y-axis, currency). Bars are green when `savedAmount ≥ 0` and red when negative. A `savingsRate` trend line (right Y-axis, %) is overlaid using `var(--color-chart-3)`. Historical import years where `savingsRate` is `null` produce a gap in the line (`connectNulls={false}`).
3. **Investment per Year (BarChart)** — `investedAmount` per year in primary color.
4. **Interest per year (BarChart)** — `interestsEarned` per year in teal (`chart-2`). The secondary-chart row is a 3-column grid at `lg`.

Y-axes on all currency charts are formatted as `Xk` (thousands). The savings chart has a second right Y-axis formatted as `%` for the savings rate line.

### Detail Table

Displays all `EvolutionYearMetric` fields for each eligible year: source, year, starting balance, final balance, saved amount, invested amount, accumulated invested, interest earned, total income, total expenses, and savings rate. Savings rate is shown as a percentage with one decimal place, or `—` when `null`. Historical rows expose edit and delete actions; full Gridly years remain read-only from this table.

### Empty State

When there are fewer than two metric rows, `EvolutionDashboard` replaces the charts and detail table with an empty state. The header KPIs remain visible, and the empty state explains that a single year is not enough for a useful trend. The primary action opens `HistoricalYearDialog`, letting the user add a summary-only historical import without leaving Evolution.

## Loading State

`loading.tsx` renders inside `BaseAppShell` so the app background, sticky header, wordmark, and navigation area remain stable while the server loads all years. The skeleton mirrors the final dashboard structure: hero/header copy, total wealth stripe, six KPI cards, the primary balance chart, three secondary charts, and the detail table grid.

## Out Of Scope

The first version does not include forecasting, planning controls, scenario comparisons, or export.
