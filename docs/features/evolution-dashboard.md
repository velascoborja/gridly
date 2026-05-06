# Feature: Evolution Dashboard

The Evolution Dashboard is the read-only multi-year analytics view for Gridly. In Spanish UI it appears as `Evolución`.

## Navigation

The main navigation shows `Meses`, `Año`, and `Evolución`.

`Evolución` is always visible. When a user has only one configured year, the tab is disabled and displays this hint on hover, focus, or tap:

`Disponible cuando tengas más de un año registrado.`

Once the user has two or more configured years, the tab links to `/{locale}/evolution`. The year selector is hidden on this route because the dashboard compares every recorded year.

## Data Loading

The route loads all configured years for the authenticated user on the server. It derives compact dashboard metrics from computed `YearData` values and does not reuse `YearPageClient`, which is scoped to a single selected year.

## Metric Definitions

- `startingBalance`: the year's configured starting balance.
- `finalBalance`: December ending balance.
- `savedAmount`: `finalBalance - startingBalance`.
- `investedAmount`: sum of monthly `investment`.
- `accumulatedInvested`: running invested total across all recorded years.
- `totalIncome`: sum of monthly total income.
- `totalExpenses`: sum of monthly total expenses.
- `savingsRate`: `savedAmount / totalIncome`, shown as unavailable when income is zero or negative.

Annual savings intentionally means cash balance growth. Investment remains a separate metric because Gridly counts monthly investment inside expenses.

## UI

The v1 dashboard includes four KPI cards, a primary final-balance evolution chart, secondary savings and investment charts, and a compact year-by-year table.

## Out Of Scope

The first version does not include forecasting, planning controls, scenario comparisons, editing, or export.
