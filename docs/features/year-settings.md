# Feature: Year Settings & Setup

This document describes how years are created, configured, and managed in Gridly.

## Year Creation Flow

Years are created through a guided setup process located at `/setup/[year]`.

1. **Setup Page:** `src/app/[locale]/setup/[year]/page.tsx` serves the setup form.
2. **Client Component:** `src/components/setup/setup-page-client.tsx` handles the form state and submission.
3. **API Call:** A `POST` request is sent to `/api/years` with the initial configuration.
4. **Data Prefill:** Upon successful creation, a `POST` request is sent to `/api/years/[year]/prefill`. This endpoint initializes all 12 months for that year using the provided configuration.
5. **Return Navigation:** The create-year entry point includes a `redirect` query pointing to the current month or annual summary route. `src/components/layout/nav-selectors.tsx` derives that redirect from the current browser pathname at click time so locally switched views (month/summary via `pushState`) return to the visible view even before any cache refresh. The setup client refreshes the Next route cache before navigating back.

## Configuration Fields (YearConfig)

The following fields define the financial baseline for a year:

| Field | Description | Note |
|---|---|---|
| `startingBalance` | Initial balance at the start of the year. | Only editable for the first year or if no previous year exists. |
| `estimatedSalary` | Expected monthly net income. | Used to prefill monthly `payslip`. |
| `hasExtraPayments` | Boolean indicating if the user receives extra pays (June/Dec). | |
| `estimatedExtraPayment`| Amount for each extra payment. | Used to prefill `additionalPayslip` in months 6 and 12. |
| `monthlyInvestment` | Standard monthly savings/investment goal. | Prefills monthly `investment`. |
| `monthlyHomeExpense` | Standard monthly housing/recurring expenses. | Prefills monthly `homeExpense`. |
| `monthlyPersonalBudget` | Standard monthly discretionary budget. | Prefills monthly `personalExpense`. |
| `interestRate` | Yearly interest rate for savings (decimal). | e.g., `0.02` for 2%. |

## Recurring Expense Templates

Year setup also supports any number of recurring expense templates. These are stored in `year_recurring_expenses` and contain:

| Field | Description |
|---|---|
| `label` | Expense name shown to the user. |
| `amount` | Monthly amount copied into each month. |
| `sortOrder` | Stable ordering for setup, annual settings, and monthly views. |

During setup, the client sends `recurringExpenses` with the year creation request. The prefill endpoint then copies those templates into `monthly_recurring_expenses` for all 12 months.

## Annual Summary & Updates

Once a year is created, its configuration can be modified within the **Annual Summary** view (`src/app/[locale]/[year]/summary/page.tsx`).

- **Component:** `src/components/annual/year-config-form.tsx` allows inline editing of all fields.
- **Persistence:** Changes are sent via `PATCH /api/years/[year]`.
- **Confirmation:** Before saving any setup value, the form shows a warning that the change will overwrite monthly fixed values.
- **Cache Refresh:** After a successful save, the client calls `router.refresh()` so route cache restores after visiting setup or another route include the updated annual balance.
- **Side Effects:** Saving a setup value reapplies the full annual baseline to all 12 months. The client uses `applyYearConfigToMonth` for immediate recalculation, and `PATCH /api/years/[year]` persists the same overwrite rules:
  - `payslip` = `estimatedSalary`.
  - `homeExpense` = `monthlyHomeExpense`.
  - `personalExpense` = `monthlyPersonalBudget`.
  - `investment` = `monthlyInvestment`.
  - `additionalPayslip` = `estimatedExtraPayment` for June/December when extra pays are enabled, otherwise `0`.
  - `interestsManualOverride` is reset to `false` so interest follows the current annual rate again.
  - Manual monthly fixed-value edits are overwritten; additional entries, bonuses, and personal remaining values are preserved.

Annual Summary also includes the recurring expense template editor.

- **Endpoint:** `PUT /api/years/[year]/recurring-expenses`.
- **Side Effect:** The template list is authoritative. Saving it deletes all monthly recurring expense rows for that year and recreates them from the template, overriding any manual monthly recurring expense edits.
- **Confirmation:** The UI shows a Spanish confirmation dialog before applying this overwrite.

## Implementation Details

### Currency Handling
- **Database:** Stored as `numeric(12, 2)` (PostgreSQL).
- **TypeScript:** Converted to `number` for calculations and back to `string` for DB operations.
- **Formatting:** Use `formatCurrency` from `@/lib/utils`.

### Month Prefill Logic
The prefill logic (`src/lib/server/year-planning.ts`) follows these rules:
- All 12 months are created.
- `payslip` = `estimatedSalary`.
- `homeExpense` = `monthlyHomeExpense`.
- `personalExpense` = `monthlyPersonalBudget`.
- `investment` = `monthlyInvestment`.
- If `hasExtraPayments` is `true`: Months 6 and 12 get `additionalPayslip` = `estimatedExtraPayment`.
- Every `year_recurring_expenses` row is copied into every month as a `monthly_recurring_expenses` row.

### Interest Calculation
Interests are typically calculated based on the `interestRate` and the monthly balance, unless manually overridden.
When a year setup value is saved from the annual summary, monthly interest overrides are cleared so the updated annual setup controls the projected balance chain.
