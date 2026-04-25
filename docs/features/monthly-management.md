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
- The UI uses optimistic updates or instant feedback to ensure a smooth experience.

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
