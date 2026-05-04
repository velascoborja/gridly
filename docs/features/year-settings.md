# Feature: Year Settings & Setup

This document describes how years are created, configured, and managed in Gridly.

## Year Creation Flow

Years are created through a guided setup process located at `/setup/[year]`.

1. **Setup Page:** `src/app/[locale]/setup/[year]/page.tsx` serves the setup form.
2. **Client Component:** `src/components/setup/setup-page-client.tsx` handles the form state and submission.
3. **Server Action:** `createAndPrefillYear` in `src/lib/server/actions/years.ts` validates ownership, inserts the year configuration, stores recurring expense templates, initializes all 12 months, copies recurring expenses into each month, propagates carry-over, and revalidates the app layout.
4. **Return Navigation:** The create-year entry point includes a `redirect` query pointing to the current month or annual summary route. Navigation components use `buildSetupHrefFromPathname` from `src/lib/year-routes.ts` to derive this redirect from the current browser pathname at click time. This ensures that even if the user has navigated locally (via `pushState`), the setup flow returns them to the exact view they were looking at. After the Server Action completes, the setup client performs a hard navigation to the localized redirect target.

The setup screen is a single-page guided workspace. Desktop layouts use a left section stepper, central grouped setup form, and sticky year preview panel. Mobile layouts collapse the stepper into a horizontal section row and render the preview as a normal review block near submission. The mobile stepper sticks to the top on an opaque setup-background band so scrolled form content does not show through above or behind the toolbar.

## Setup Layout

The creation screen groups setup fields by financial purpose:

- **Starting point:** `startingBalance`, including a locked derived state when the balance comes from the previous year.
- **Income:** `estimatedSalary`, `hasExtraPayments`, and `estimatedExtraPayment`.
- **Monthly plan:** `monthlyHomeExpense`, `monthlyPersonalBudget`, and `monthlyInvestment`.
- **Growth:** `interestRate`.
- **Recurring expenses:** the year recurring expense template editor.
- **Review and create:** final error handling, live preview, and submit action.

The live preview is derived only from local form state. It shows the starting balance, monthly income, planned expenses, monthly investment, estimated monthly savings before interest, extra-pay status, and a reminder that recurring templates are copied into all 12 months. It does not add fields to the creation payload.

The create button is enabled only when the required setup sections are ready: Starting point, Income, and Monthly plan. Recurring expenses remain optional for submission.

Currency labels on the setup page omit unit suffixes, while placeholder hints show the Euro symbol after the example amount. Editable currency inputs keep the raw text the user enters. `parseLocalizedNumber` converts localized input text back to a number for the live preview and `createAndPrefillYear` payload. The interest rate remains a plain percentage input.

The section stepper derives completed state from local form readiness and only includes the setup sections that users need to navigate: Starting point, Income, Monthly plan, and Recurring expenses. Readiness uses `hasSetupFieldValue`, so any non-empty input, including `0`, counts as entered data. Starting point is complete once the editable starting balance is filled or when the balance is derived from the previous year. Income requires salary and, when extra pays are enabled, the extra-pay amount. Monthly plan requires the three monthly currency values plus the interest rate. Recurring expenses are optional, so the stepper marks that item with a neutral dashed treatment while empty, then switches to the green completed state once at least one recurring expense exists.

When the starting balance is derived from the previous year, the setup input is read-only and displays a locale-formatted Euro amount via `formatCurrency` (for example, `1.234,56 €` in `es`). Submission still sends the numeric carry-over value, not the formatted string.

## Navigation & Workspace Model

Gridly employs an "In-Year Workspace" model to manage the complex financial state of a year:

- **Unified Client Shell:** Both monthly and annual summary pages delegate rendering to `YearPageClient`. This component owns the current `YearData` and manages local navigation.
- **Pure Local Navigation:** Switching between months or views (summary/settings) uses `window.history.pushState()`. This avoids server-side data refetching, allowing the UI to remain responsive and preserve unsaved client-side recalculations.
- **Route Synchronization:** The `YearPageClient` listens for `popstate` events and uses `parseYearRoutePathname` from `src/lib/year-routes.ts` to keep the UI tabs and the URL in sync.
- **Server Navigation:** Changing the *year* (e.g., from 2024 to 2025) or going to the landing page uses standard Next.js router transitions, as these require entirely new data sets or different layouts.

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

During setup, the client sends `recurringExpenses` to `createAndPrefillYear`. The Server Action stores valid templates and then copies them into `monthly_recurring_expenses` for all 12 months.

## Annual Summary & Updates

Once a year is created, its configuration can be modified within the **Annual Summary** view (`src/app/[locale]/[year]/summary/page.tsx`).

- **Component:** `src/components/annual/year-config-form.tsx` allows inline editing of all fields.
- **Layout:** The annual setup dialog groups setup fields into Starting point, Income, Monthly allocation, and Growth assumptions. The form is single-column on mobile and pairs Income with Monthly allocation on larger screens.
- **Scroll Chrome:** The annual setup dialog header is sticky with a translucent blurred card background so metadata and actions remain visible while the form body scrolls underneath.
- **Apply Scope:** The dialog includes an "Apply changes from" selector, defaulting to January. Monthly setup value saves and recurring expense reapplications only overwrite months from the selected month through December. `startingBalance` remains a year-level chain anchor.
- **Persistence:** Changes are sent via `PATCH /api/years/[year]`.
- **Confirmation:** Before saving any setup value, the form shows a warning that the change will overwrite monthly fixed values from the selected month onward.
- **Cache Refresh:** After a successful save, the client calls `router.refresh()` so route cache restores after visiting setup or another route include the updated annual balance.
- **Side Effects:** Saving a monthly setup value reapplies the annual baseline to the selected apply-from range. The client uses `applyYearConfigToMonth(month, config, applyFromMonth)` for immediate recalculation, and `PATCH /api/years/[year]` persists the same overwrite rules for months in that range:
  - `payslip` = `estimatedSalary`.
  - `homeExpense` = `monthlyHomeExpense`.
  - `personalExpense` = `monthlyPersonalBudget`.
  - `investment` = `monthlyInvestment`.
  - `additionalPayslip` = `estimatedExtraPayment` for June/December when extra pays are enabled, otherwise `0`.
  - Manual override flags for the setup-backed fields are cleared for the selected range.
  - `interestsManualOverride` is reset to `false` so interest follows the current annual rate again.
  - Manual monthly fixed-value edits are overwritten only in the selected range; earlier months keep their existing fixed values. Additional entries and personal remaining values are preserved.

Annual Summary also includes the recurring expense template editor.

- **Endpoint:** `PUT /api/years/[year]/recurring-expenses`.
- **Side Effect:** The template list is authoritative. Saving it deletes monthly recurring expense rows from the selected apply-from month through December and recreates them from the template, overriding manual monthly recurring expense edits only in that range.
- **Confirmation:** The UI shows a localized confirmation dialog before applying this overwrite.

## Implementation Details

### Currency Handling
- **Database:** Stored as `numeric(12, 2)` (PostgreSQL).
- **TypeScript:** Converted to `number` for calculations and back to `string` for DB operations.
- **Formatting:** Use `formatCurrency` from `@/lib/utils`.

### Month Prefill Logic
The setup prefill logic in `createAndPrefillYear` follows these rules:
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
