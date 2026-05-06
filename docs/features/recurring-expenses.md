# Feature: Recurring Expenses

## Overview

Recurring expenses let users define named monthly expenses that repeat across a year, such as rent, memberships, or subscriptions. They are distinct from fixed scalar expenses and from ad hoc additional entries.

## Key Components

- **Setup editor:** `src/components/setup/setup-page-client.tsx` collects recurring expense templates during year creation.
- **Annual editor:** `src/components/annual/year-config-form.tsx` lets users edit the authoritative template list from Annual Summary.
- **Monthly section:** `src/components/monthly/recurring-expenses-list.tsx` renders recurring expenses inside `src/components/monthly/fixed-expenses-card.tsx`. Users can edit or delete recurring expenses for the selected month only.
- **Template table:** `year_recurring_expenses` stores year-level defaults.
- **Monthly table:** `monthly_recurring_expenses` stores editable per-month copies.

## Implementation Details

During setup, `createAndPrefillYear` in `src/lib/server/actions/years.ts` saves the template list and copies every template into all 12 months.

Annual template updates use `PUT /api/years/[year]/recurring-expenses`. This endpoint replaces the template list, deletes all monthly recurring expense rows for that year, recreates them from the new template, and propagates downstream year carry-over.
After the annual editor receives the updated `yearData`, it refreshes the current App Router route cache so returning from setup or another route keeps the recalculated recurring expense totals.

Monthly changes use:

- `PATCH /api/months/[monthId]/recurring-expenses/[entryId]`
- `DELETE /api/months/[monthId]/recurring-expenses/[entryId]`

Monthly changes affect only the selected month. Monthly recurring expense amount edits sanitize typed or pasted text through `sanitizeNumericInput`, keeping only digits plus `,` and `.` decimal separators before parsing the amount. After persistence, the monthly client state is updated and the full month chain is recomputed locally; the monthly view does not call `router.refresh()` for these edits, so month-to-month navigation keeps using the existing client state and route cache. The monthly page does not offer a way to add recurring expenses; additions are managed from setup or Annual Summary templates.

## Calculations

Recurring expenses are included in `totalExpenses` in `src/lib/calculations.ts`.

```ts
homeExpense + personalExpense + investment + recurringExpensesTotal + additionalExpensesTotal
```

This means recurring expenses affect monthly savings, ending balance, downstream starting balances, annual summaries, and exports.
