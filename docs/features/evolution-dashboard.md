# Feature: Evolution Dashboard

The Evolution Dashboard is the read-only multi-year analytics view for Gridly. In Spanish UI it appears as `Evolución`.

## Navigation

The main navigation shows `Meses`, `Año`, and `Evolución`.

`Evolución` is always visible. When a user has fewer than two configured years up to the current calendar year, the tab is disabled and displays this hint on hover, focus, or tap:

`Disponible cuando tengas más de un año registrado hasta el año actual.`

Once the user has two or more configured years up to the current calendar year, the tab links to `/{locale}/evolution`. The year selector is hidden on this route because the dashboard compares the current and previous years, excluding future configured years.

## Data Loading

The route loads configured years for the authenticated user on the server with `maxYear` set to the current calendar year. It derives compact dashboard metrics from computed `YearData` values and does not reuse `YearPageClient`, which is scoped to a single selected year. Future configured years are intentionally excluded from the analytics until they become the current year.

If the computed metrics result in fewer than two years (e.g. only one year has a December month), the page server component redirects to the default year route. This is a server-side guard independent of the nav tab being disabled.

## Computation Layer

`src/lib/evolution.ts` exports two functions:

**`deriveEvolutionMetrics(years: YearData[]): EvolutionYearMetric[]`**

Sorts years chronologically and produces one `EvolutionYearMetric` per year supplied by the route. Years without a December month are skipped. `accumulatedInvested` is a running total that carries forward across eligible years in chronological order.

**`summarizeEvolutionMetrics(metrics: EvolutionYearMetric[]): EvolutionSummary`**

Collapses the per-year metrics into a single summary object used by the KPI cards:

- `latestFinalBalance`: `finalBalance` of the most recent eligible year.
- `totalSaved`: sum of `savedAmount` across eligible years.
- `averageSavingsPerYear`: mean `savedAmount` across eligible years.
- `accumulatedInvested`: `accumulatedInvested` of the most recent eligible year.
- `totalWealth`: latest eligible final balance plus accumulated invested.
- `bestYear`: the year with the highest `savedAmount`. `null` when there are no years.

## Metric Definitions (`EvolutionYearMetric`)

- `startingBalance`: the year's configured starting balance.
- `finalBalance`: December ending balance.
- `savedAmount`: `finalBalance - startingBalance`.
- `investedAmount`: sum of monthly `investment` for that year.
- `accumulatedInvested`: running sum of `investedAmount` up to and including that year.
- `totalIncome`: sum of monthly total income.
- `totalExpenses`: sum of monthly total expenses.
- `savingsRate`: `savedAmount / totalIncome`, or `null` when income is zero or negative.

Annual savings intentionally means cash balance growth. Investment remains a separate metric because Gridly counts monthly investment inside expenses.

## UI Components

| Component | File | Role |
|---|---|---|
| `EvolutionDashboard` | `evolution-dashboard.tsx` | Root client component; owns layout and calls `summarizeEvolutionMetrics` |
| `EvolutionKpiCards` | `evolution-kpi-cards.tsx` | Five summary KPI cards |
| `EvolutionCharts` | `evolution-charts.tsx` | Three charts |
| `EvolutionDetailTable` | `evolution-detail-table.tsx` | Full year-by-year data table |

### KPI Cards

Five cards derived from `EvolutionSummary`:

1. **Latest Balance** (`latestFinalBalance`) — December ending balance of the most recent eligible year.
2. **Total Saved** (`totalSaved`) — Cumulative savings across eligible years. Value is colored green when ≥ 0, red when negative.
3. **Accumulated Investment** (`accumulatedInvested`) — Invested total up to the current year.
4. **Average Annual Savings** (`averageSavingsPerYear`) — Mean savings across eligible years.
5. **Best Year** (`bestYear`) — The year with the highest `savedAmount`. Shows the year number as the primary value and the saved amount in the note. Displays "N/A" when undefined.

### Charts

1. **Final Balance (LineChart)** — Year-over-year final balance trend. One data point per year.
2. **Savings per Year (BarChart)** — `savedAmount` per year. Bars are green when `savedAmount ≥ 0` and red when negative.
3. **Investment per Year (BarChart)** — `investedAmount` per year in primary color.

Y-axes on all charts are formatted as `Xk` (thousands).

### Detail Table

Displays all `EvolutionYearMetric` fields for each eligible year: year, starting balance, final balance, saved amount, invested amount, accumulated invested, total income, total expenses, and savings rate. Savings rate is shown as a percentage with one decimal place, or `—` when `null`.

## Loading State

`loading.tsx` renders inside `BaseAppShell` so the app background, sticky header, wordmark, and navigation area remain stable while the server loads all years. The skeleton mirrors the final dashboard structure: hero/header copy, total wealth stripe, five KPI cards, the primary balance chart, two secondary charts, and the detail table grid.

## Out Of Scope

The first version does not include forecasting, planning controls, scenario comparisons, editing, or export.
