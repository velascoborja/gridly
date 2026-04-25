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

During setup, `POST /api/years` saves the template list and `POST /api/years/[year]/prefill` copies every template into all 12 months.

Annual template updates use `PUT /api/years/[year]/recurring-expenses`. This endpoint replaces the template list, deletes all monthly recurring expense rows for that year, recreates them from the new template, and propagates downstream year carry-over.

Monthly changes use:

- `PATCH /api/months/[monthId]/recurring-expenses/[entryId]`
- `DELETE /api/months/[monthId]/recurring-expenses/[entryId]`

Monthly changes affect only the selected month. The monthly page does not offer a way to add recurring expenses; additions are managed from setup or Annual Summary templates.

## Calculations

Recurring expenses are included in `totalExpenses` in `src/lib/calculations.ts`.

```ts
homeExpense + personalExpense + investment + recurringExpensesTotal + additionalExpensesTotal
```

This means recurring expenses affect monthly savings, ending balance, downstream starting balances, annual summaries, and exports.
