# Historical Year Imports Design

## Overview

Gridly should let users add summary-only data for years they tracked outside the app so the Evolution dashboard can show a longer historical trend. These imported historical years are not full Gridly years: they do not have months, recurring expenses, setup configuration, exports, or carry-over behavior.

Version 1 supports historical imports only for years before the user's earliest full Gridly year. This gives imported data a clear role as pre-Gridly history and avoids mixed chains such as a full Gridly year, then an imported gap, then another full Gridly year.

## Goals

- Let users add past annual aggregate data from the Evolution page.
- Include imported years in Evolution KPIs, charts, and detail rows.
- Keep imported data separate from full Gridly years and monthly planning.
- Disable non-applicable year views when a selected year is historical.
- Avoid changing month chain, carry-over, setup, recurring expense, and export behavior.

## Non-Goals

- Importing or editing monthly data for historical years.
- Forecasting or scenario planning based on historical imports.
- Allowing historical imports for years after the first full Gridly year.
- Using historical imports to alter starting balances or carry-over for full Gridly years.
- Exporting historical imported years as full annual workbooks.

## Data Model

Add a separate `historical_years` table.

Fields:

- `id`
- `userId`
- `year`
- `startingBalance`
- `finalBalance`
- `investedAmount`
- `createdAt`
- `updatedAt`

Constraints:

- Unique `(userId, year)`.
- `userId` references `users.id` with cascade delete.
- Numeric fields use the same `numeric(12, 2)` storage pattern as other money fields.

Derived values:

- `savedAmount = finalBalance - startingBalance`.
- `accumulatedInvested` remains computed by the evolution engine across all eligible metric sources in chronological order.

The existing `years` table remains the source of truth for full Gridly years. Historical rows are not inserted into `years`, and no `months` rows are synthesized.

## Eligibility Rules

Historical imports are allowed only when the user has at least one full Gridly year.

Create and update validation must enforce:

- Year is an integer.
- Year is strictly before the earliest full Gridly year for that user.
- Year does not already exist in the user's full Gridly `years`.
- Year does not duplicate another `historical_years` row for the user, except the row being patched.
- `startingBalance` and `finalBalance` are finite currency values.
- `investedAmount` is finite and greater than or equal to `0`.
- `finalBalance` may be lower than `startingBalance`, producing negative savings.

Historical imports do not trigger carry-over propagation.

## Evolution Data Flow

Introduce a normalized source shape for metric derivation:

```ts
type EvolutionMetricSource =
  | { source: "gridly"; yearData: YearData }
  | {
      source: "historical";
      year: number;
      startingBalance: number;
      finalBalance: number;
      investedAmount: number;
    };
```

`deriveEvolutionMetrics` accepts these sources and returns the existing metric shape with an added `source: "gridly" | "historical"` field.

For Gridly years:

- `finalBalance` comes from December ending balance.
- `savedAmount = finalBalance - config.startingBalance`.
- `investedAmount`, `totalIncome`, `totalExpenses`, and `savingsRate` are derived from monthly data.

For historical years:

- `finalBalance` comes from user input.
- `savedAmount = finalBalance - startingBalance`.
- `investedAmount` comes from user input.
- `totalIncome`, `totalExpenses`, and `savingsRate` are `null`.

Server loading moves behind `getEvolutionSourcesForUser(userId, maxYear)`. It loads historical rows and full Gridly years up to the current calendar year, merges them, sorts chronologically, and returns the normalized sources.

The `/evolution` page still requires at least two eligible metric rows. Historical rows count toward that requirement.

## Evolution UI

The Evolution page adds an action near the dashboard header:

- English: `Add historical year`
- Spanish: `Añadir año histórico`

The action opens a compact form dialog with:

- Year
- Starting balance
- End year balance
- Total amount invested
- Read-only total saved preview

The form uses the existing localized numeric parsing and currency input conventions. Submitting shows pending feedback, persists the row, and refreshes the Evolution dashboard data.

The Evolution detail table includes both source types. Historical rows show the source label `Historical` / `Histórico`. Gridly rows show `Gridly`. Historical rows expose row actions:

- Edit historical year
- Delete historical year

Editing reuses the same validation rules. Deleting removes only the historical row and refreshes Evolution metrics.

## Year Navigation Behavior

Historical years appear in the year selector so users can inspect their position in the overall history. Selecting a historical year does not route to a fake monthly or annual workspace.

When the selected year is historical:

- The Months tab is disabled.
- The Annual Summary tab is disabled.
- The Evolution tab remains enabled.
- The disabled hint for Months and Annual Summary states that these views are only available for years added through Gridly month tracking.

This requires the navigation layer to know which years are full Gridly years and which are historical. Use this shared option shape:

```ts
interface YearOption {
  year: number;
  source: "gridly" | "historical";
}
```

Existing paths that only support full Gridly years continue to receive or derive gridly-only year lists.

## API And Persistence

Add CRUD endpoints:

- `GET /api/historical-years`
- `POST /api/historical-years`
- `PATCH /api/historical-years/[id]`
- `DELETE /api/historical-years/[id]`

The initial UI needs create, edit, and delete because aggregate data is easy to mistype and should be correctable without database access.

All endpoints require authentication and ownership checks. API responses should return parsed numeric values as numbers. Database writes should convert numbers to strings for Drizzle numeric fields.

After successful mutations, the client should call `router.refresh()` so the server-rendered Evolution page reloads the merged metric source list.

## Internationalization

All user-facing strings must be added to `messages/es.json` and `messages/en.json`.

Required copy groups:

- Evolution action: add historical year.
- Historical year form labels, submit labels, pending state, and validation errors.
- Source labels: Gridly, Historical.
- Row actions: edit and delete historical year.
- Disabled tab hints for historical selected years.
- Delete confirmation copy.

Spanish copy should be added first, with English equivalents kept in sync.

## Documentation

Add `docs/features/historical-year-imports.md` and link it from `AGENTS.md`.

Update `docs/features/evolution-dashboard.md` to explain that Evolution can include both full Gridly years and summary-only historical imports, and that historical imports are limited to years before the earliest full Gridly year.

## Testing

Schema and source tests:

- `historical_years` table exists with unique `(userId, year)`.
- Historical rows cascade when the user is deleted.

Validation tests:

- Reject unauthenticated mutation requests.
- Reject years equal to or after the earliest full Gridly year.
- Reject overlap with an existing full Gridly year.
- Reject duplicate historical years.
- Allow `finalBalance < startingBalance`.
- Reject negative `investedAmount`.

Evolution computation tests:

- Gridly and historical sources sort together chronologically.
- Historical sources derive `savedAmount` from start and end balances.
- Historical sources contribute to yearly and accumulated investment.
- Historical sources return `null` for income, expenses, and savings rate.

UI/source tests:

- Evolution page loads merged metric sources.
- Add Historical Year action exists on Evolution.
- Historical rows show source labels.
- Historical rows expose edit and delete actions.
- Nav disables Months and Annual Summary for historical selected years.

I18n and docs tests:

- Spanish and English labels exist for all new UI strings.
- Feature docs mention summary-only limitations and the before-earliest-Gridly-year rule.

## Rollout Order

1. Add database schema and types for historical years.
2. Add server helpers for loading and validating historical years.
3. Update evolution metric derivation to accept normalized Gridly and historical sources.
4. Add historical year CRUD API routes.
5. Add Evolution page create/edit/delete UI.
6. Update year navigation contracts for historical year options.
7. Add docs and complete full verification.
