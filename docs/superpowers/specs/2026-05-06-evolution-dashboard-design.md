# Evolution Dashboard Design

## Purpose

Add a new main navigation tab, `Evolución`, to help users understand how their finances evolve across recorded years. The first version is a read-only historical dashboard. It does not include planning, projections, or editable controls, but the information architecture should leave room for future planning tools.

## Scope

### In Scope

- Always show an `Evolución` tab to the right of `Año`.
- Disable the tab when the user has only one configured year.
- Show a short hint on hover, focus, or tap when the disabled tab is unavailable.
- Enable the tab once the user has two or more configured years.
- Route enabled users to a global `/{locale}/evolution` page.
- Hide the year selector while `Evolución` is active because the page compares all recorded years.
- Show cross-year metrics, charts, and a compact detail table.
- Add Spanish and English translations for all new UI strings.
- Add feature documentation under `docs/features/`.

### Out of Scope

- Forecasting future years.
- Goal planning.
- Scenario comparison.
- Editing year or month data from the `Evolución` page.
- Exporting the multi-year dashboard.

## Navigation

The main navigation order is:

`Meses` | `Año` | `Evolución`

The `Evolución` tab is always visible.

When the user has one configured year:

- The tab is disabled and not navigable.
- It does not receive `aria-current`.
- It exposes disabled semantics for assistive technologies.
- Hover, focus, or tap shows a short hint:
  - Spanish: `Disponible cuando tengas más de un año registrado.`
  - English: `Available once you have more than one recorded year.`

When the user has two or more configured years:

- The tab links to `/{locale}/evolution`.
- It becomes the active tab on that route.
- The year selector is hidden on that route.
- The user menu remains visible.

Direct visits to `/{locale}/evolution` with fewer than two configured years should redirect to the user's default app route rather than rendering an empty dashboard.

## Route And Data Boundary

`Evolución` should be implemented as a global route, not as part of `YearPageClient`.

Reasoning:

- `YearPageClient` owns one selected `YearData` and local in-year navigation.
- `Evolución` compares all recorded years and should not be tied to a selected year.
- A route-level server load keeps the data boundary clear and avoids pushing all-year data into the single-year client shell.

The page should load authenticated user data server-side. A new server helper should fetch all configured years in ascending order, compute yearly metrics, and pass compact data to the client UI.

## Metric Definitions

For each recorded year:

- `year`: the calendar year.
- `startingBalance`: `YearConfig.startingBalance`.
- `finalBalance`: December `endingBalance`.
- `savedAmount`: `finalBalance - startingBalance`.
- `investedAmount`: sum of the 12 monthly `investment` values.
- `accumulatedInvested`: running total of `investedAmount` from the first recorded year through the current row.
- `totalIncome`: sum of monthly `totalIncome`.
- `totalExpenses`: sum of monthly `totalExpenses`.
- `savingsRate`: `savedAmount / totalIncome`; show an empty or neutral value when `totalIncome <= 0`.

Annual savings intentionally means cash balance growth, not cash plus investments. This keeps the metric consistent with Gridly's existing calculation model, where `investment` is tracked separately and counted inside monthly expenses.

## UI Structure

Use the narrative overview layout.

Top KPI row:

- Latest recorded final balance, using the final balance from the most recent configured year.
- Total saved across all recorded years.
- Accumulated invested amount.
- Best year by `savedAmount`.

Primary chart:

- Final balance evolution per year.

Secondary charts:

- Saved amount per year.
- Invested amount per year.

Detail table:

- Year.
- Starting balance.
- Final balance.
- Saved amount.
- Invested amount.
- Accumulated invested.
- Total income.
- Total expenses.
- Savings rate.

The page is read-only. It should avoid explanatory marketing copy and instead use concise labels, chart titles, and empty/neutral states.

## Visual Direction

Follow `DESIGN.md` and existing annual dashboard patterns:

- Premium fintech styling.
- White/elevated surfaces with restrained 4px-8px radii.
- Dense but legible financial data.
- Tabular numerals for money and percentages.
- Purple only for primary active or selected states.
- Avoid making the dashboard read as a one-color purple page.

Charts should use existing Recharts patterns where possible and share the formatting conventions from the annual charts.

## Error And Empty States

- Unauthenticated access follows the existing app auth behavior.
- No configured years follows the existing setup/default route behavior.
- One configured year on direct `/{locale}/evolution` access redirects to the user's default app route.
- A year with malformed or incomplete data should not normally exist because setup creates all 12 months. If a helper cannot compute a complete year, prefer excluding that year from the metric set and documenting the fallback in code rather than crashing the dashboard.

## Testing

Add focused coverage for:

- Yearly metric derivation.
- `savedAmount = finalBalance - startingBalance`.
- `investedAmount` as the sum of monthly `investment`.
- `accumulatedInvested` running total.
- `savingsRate` behavior when `totalIncome <= 0`.
- Navigation tab disabled state for one configured year.
- Navigation tab enabled state and active state for two or more configured years.
- Direct route handling when fewer than two years exist.
- Spanish and English translation keys.

## Documentation

Add `docs/features/evolution-dashboard.md` and link it from the feature documentation list in `AGENTS.md` if implementation changes are made. The feature doc should capture:

- Route and navigation rules.
- One-year disabled tab behavior.
- Metric definitions.
- Read-only scope.
- Future planning/projection work as explicitly out of scope for v1.
