# Feature: Monthly Management

This document describes the core monthly tracking interface and logic in Gridly.

## Overview

The Monthly View (`/locale/[year]/[month]`) is the primary workspace for users. It allows tracking income, fixed expenses, and monitoring the monthly financial health.

## Key Components

- **Income Card:** Displays net salary (`payslip`), extra payments (`additionalPayslip`), bonuses, and generated interests.
- **Fixed Expenses Card:** Tracks recurring costs such as housing (`homeExpense`), personal budget (`personalExpense`), and investments (`investment`).
- **Recurring Expenses Section:** Shows named planned expenses copied from the year template inside the Fixed Expenses card. Users can edit or delete rows for the current month only.
- **Summary Card:** Provides a real-time breakdown of `Total Income`, `Total Expenses`, and the resulting `Savings`.
- **Month Chain:** Shows the `Starting Balance` (inherited from the previous month) and the `Ending Balance` (starting balance + savings).

## Logic & Interactions

### Data Persistence
- Client-side edits to fields (e.g., `payslip`, `homeExpense`) are saved via `PATCH /api/months/[monthId]`.
- Recurring expense edit/delete operations are saved via `/api/months/[monthId]/recurring-expenses/[entryId]`.
- After a successful monthly mutation, `MonthOverview` recomputes the full month chain and lifts the updated `YearData` to `YearPageClient`. It does not call `router.refresh()`, preserving the App Router client cache while navigating between months.
- The UI uses optimistic updates or instant feedback to ensure a smooth experience.

### Month Navigation
- Month, summary, and settings switches inside `YearPageClient` update local React state and call `window.history.pushState()`. All URL generation uses the shared utilities in `src/lib/year-routes.ts`. Next.js 16 integrates native history updates with router state, so the URL changes without forcing a new server navigation for each month.
- Direct visits to `/locale/[year]/[month]` and browser back/forward still hydrate from the App Router pages and use `parseYearRoutePathname` from `src/lib/year-routes.ts` to synchronize back into the client state.

### Recurring Expense Behavior

Monthly recurring expense rows live in `monthly_recurring_expenses`.

- Rows copied from the annual template keep `yearRecurringExpenseId`.
- Monthly changes affect only the selected month.
- If the annual template list is later saved from Annual Summary, all monthly recurring expense rows for the year are replaced from the updated template.

### Interest Calculation
- Monthly interest is calculated based on the `Starting Balance` and the `YearConfig.interestRate`.
- Formula: `(Starting Balance * interestRate) / 12`.
- Users can manually override the interest amount if needed.

### Spanish Employment Conventions
- **Extra Pays:** In Spain, net salary is often paid in 14 payments. Gridly automatically handles this by prefilling `additionalPayslip` in June (Month 6) and December (Month 12) if the year is configured with extra payments.
