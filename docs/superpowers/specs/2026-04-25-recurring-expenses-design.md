# Recurring Expenses Design

## Overview

Gridly will support year-level recurring expense templates that are copied into a dedicated recurring expenses section for each month. Users can define the templates during year setup and later edit them from annual summary settings. Each month gets its own editable copy, so month-level changes affect only that month unless the user edits the annual templates.

Recurring expenses are separate from fixed expenses and additional entries:

- Fixed expenses remain the scalar monthly defaults: home expense, personal budget, and investment.
- Recurring expenses represent named planned expenses that repeat every month, such as rent, subscriptions, insurance, or memberships.
- Additional entries remain ad hoc income or expense transactions.

## Goals

- Let users define any number of recurring expenses during year creation.
- Show recurring expenses in a new dedicated section on each monthly page.
- Let users edit and delete recurring expenses within a month.
- Keep month-level recurring expense edits local to that month.
- Let users edit the year template list from annual summary settings.
- Make annual template edits authoritative and reapply them to all months in the year, overriding monthly recurring expense edits.
- Include recurring expenses in monthly expense totals, savings, ending balances, annual summaries, and exports where applicable.

## Non-Goals

- Recurring income is not included in this feature.
- Different recurrence frequencies, such as quarterly or annual expenses, are not included.
- Applying a monthly edit to future months is not included.
- Preserving manual monthly recurring expense edits after an annual template update is not included.

## Data Model

Add `year_recurring_expenses` as the template table:

- `id`: primary key.
- `yearId`: required foreign key to `years.id`, cascade delete.
- `label`: required text.
- `amount`: `numeric(12, 2)`, default `0`.
- `sortOrder`: integer for stable UI ordering.
- `createdAt`: timestamp defaulting to now.

Add `monthly_recurring_expenses` as the per-month editable copy table:

- `id`: primary key.
- `monthId`: required foreign key to `months.id`, cascade delete.
- `yearRecurringExpenseId`: nullable foreign key to `year_recurring_expenses.id`.
- `label`: required text.
- `amount`: `numeric(12, 2)`, default `0`.
- `sortOrder`: integer for stable UI ordering.
- `createdAt`: timestamp defaulting to now.

`yearRecurringExpenseId` is nullable for resilience if a template is removed while preserving historical rows, but the monthly UI does not create new recurring expenses.

As with the existing numeric fields, database numeric values should be converted to `number` immediately after reading and converted back to strings for database writes.

## Setup Flow

The year creation page at `/setup/[year]` will include a new Spanish UI section named `Gastos recurrentes`.

The section will allow users to:

- Add a recurring expense row.
- Edit the row label.
- Edit the monthly amount.
- Remove rows before submitting.
- Preserve row order.

On submit:

1. `POST /api/years` creates the year and existing scalar config.
2. The recurring expense template list is saved for that year.
3. `POST /api/years/[year]/prefill` creates the 12 month rows.
4. Prefill copies every year recurring expense template into every month as monthly recurring expense rows.

The setup UI should follow `DESIGN.md`: compact fintech form styling, restrained surfaces, tabular financial amounts, and Spanish user-facing strings.

## Annual Summary Settings

Annual summary settings will include the same `Gastos recurrentes` template editor.

The user can add, edit, delete, and reorder template rows. Saving the annual template list is authoritative:

1. Replace the rows in `year_recurring_expenses` for the year.
2. Delete all `monthly_recurring_expenses` for every month in that year.
3. Recreate monthly recurring expense rows from the updated templates.
4. Recalculate monthly totals, savings, ending balances, and dependent annual summary values.

Because this intentionally overwrites manual monthly recurring expense changes, the UI must show a Spanish confirmation dialog before applying the update. The confirmation copy should clearly state that recurring expense changes already made inside individual months will be replaced.

## Monthly Page

The monthly page will add a new dedicated card or section named `Gastos recurrentes`.

It is separate from:

- `Gastos fijos`
- `Gastos adicionales`

The monthly recurring expenses section appears inside the fixed expenses card and will allow users to:

- Edit a row label.
- Edit a row amount.
- Delete a row.

All monthly changes affect only the current month. They do not update `year_recurring_expenses` and do not affect other months.

Rows copied from annual templates keep `yearRecurringExpenseId`.

## Calculations

Recurring expenses must be included in the monthly expense calculation.

Total expenses becomes:

```ts
homeExpense
  + personalExpense
  + investment
  + recurringExpensesTotal
  + additionalExpensesTotal
```

Savings remains:

```ts
totalIncome - totalExpenses
```

Ending balance remains:

```ts
startingBalance + savings
```

Any annual summaries, KPI cards, charts, and exports that depend on total expenses must use the updated calculation.

## API Design

Add annual template endpoints:

- `GET /api/years/[year]/recurring-expenses`
- `PUT /api/years/[year]/recurring-expenses`

`PUT /api/years/[year]/recurring-expenses` accepts the complete ordered template list. It replaces the annual template list and reapplies it to all months in the year.

Add monthly recurring expense endpoints:

- `PATCH /api/months/[monthId]/recurring-expenses/[entryId]`
- `DELETE /api/months/[monthId]/recurring-expenses/[entryId]`

Monthly endpoints operate only on the selected month.

Existing authorization and ownership checks should follow the patterns used by year, month, and additional entry endpoints.

## UI Components

Create a reusable recurring expense list editor for setup and annual settings. It should own local row state and emit an ordered list of `{ label, amount }` items.

Create or adapt a monthly recurring expenses list for month pages. It should render inside the fixed expenses card, use recurring-expense-specific labels and API routes, display a section total, and provide instant feedback while edit and delete operations are pending.

All user-facing strings should be Spanish and added to the existing localization structure.

## Error Handling

Setup should block invalid rows with empty labels or invalid amounts before submission.

Annual settings should:

- Prevent saving invalid rows.
- Show pending state while templates are being reapplied.
- Keep the existing template list visible if the save fails.
- Surface a concise Spanish error message on failure.

Monthly operations should:

- Disable the affected row or action while saving.
- Leave the previous row visible if the operation fails.
- Avoid recalculating local totals from failed optimistic changes.

## Testing

Add focused tests for:

- Prefill creates monthly recurring expenses for all 12 months from the year templates.
- Monthly recurring expense edits affect only that month.
- Monthly add and delete operations affect only that month.
- Annual template update deletes and recreates monthly recurring expenses for all months in the year.
- Annual template update overrides previous monthly recurring expense edits.
- Total expenses includes recurring expenses.
- Savings and ending balance include recurring expenses through the month chain.
- Export totals include recurring expenses.

## Documentation

Update feature documentation:

- `docs/features/year-settings.md`: setup and annual settings template behavior.
- `docs/features/monthly-management.md`: monthly recurring expense section and local edit behavior.
- `docs/features/calculations-engine.md`: total expenses formula.
- `docs/features/data-export.md`: recurring expenses in export output.

Add a dedicated feature document:

- `docs/features/recurring-expenses.md`

## Open Questions

None. The agreed behavior is:

- Recurring expenses have a dedicated monthly section.
- Monthly users can edit and delete rows, but cannot add rows.
- Monthly edits affect only that month.
- Setup and annual settings both edit the annual template list.
- Annual template edits overwrite all monthly recurring expense rows for that year.
