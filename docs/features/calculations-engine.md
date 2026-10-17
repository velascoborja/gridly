# Feature: Balance & Interest Logic

This document explains the mathematical engine behind Gridly's financial calculations.

## The Month Chain

Gridly treats a year as a sequential chain of months. The output of one month is the input of the next.

1. **Starting Balance:** 
   - For January: Inherited from `YearConfig.startingBalance`.
   - For other months: The `Ending Balance` of the previous month.
2. **Ending Balance:** `Starting Balance + Savings`.
3. **Savings:** `Total Income - Total Expenses`.

## Calculation Engine (`src/lib/calculations.ts`)

The core logic is encapsulated in the `computeMonthChain` function:
- It iterates through the 12 months.
- It calculates interests for each month based on that month's `startingBalance`.
- It aggregates all income sources (payslip, extra pays, additional incomes and interests).
- It aggregates all expense sources (fixed expenses net of personal surplus, recurring expenses, additional expenses).

Total expenses are:

```ts
homeExpense + (personalExpense - personalRemaining) + investment + recurringExpensesTotal + additionalExpensesTotal
```

## Interest Handling

- **Automatic:** Calculated as `(Starting Balance * YearConfig.interestRate) / 12`.
- **Manual Override:** Users can toggle `interestsManualOverride` to set a specific interest amount for a month, bypassing the automatic calculation. This is useful for high-yield accounts where interests are paid differently.
- **Annual Setup Reapply:** Saving year setup values from the annual summary resets monthly interest overrides and reapplies the annual baseline fields with `applyYearConfigToMonth`, so the annual balance reflects the latest setup immediately.

## Amount Expression Feedback

Additional income and expense forms accept arithmetic expressions in their amount fields. `EntryFormRow` detects arithmetic operators while the user is typing and expands its result/error line only then (or when an error is present). The line transitions its height, spacing, and opacity over 200 ms; plain numeric amounts keep the compact pre-expression layout.

## Personal Surplus Classification

Income is salary + extra pay + interest + additional income. Personal surplus is subtracted in full from personal expenses in both individual totals and the shared `calculateMonthFinancials` primitive. This reclassification preserves cash savings, ending balances, subsequent interest and carry-over, while correcting the income denominator used by savings and investment rates.

Legacy surplus outside `0 <= personalRemaining <= personalExpense` remains stored without migration or automatic correction. Calculations keep the full subtraction, even when net personal spending becomes negative, until the user corrects it manually. `src/lib/personal-remaining.ts` centralizes finite-number and range validation.

## Investment Totals

`totalMonthlyInvestment` adds the month's programmed `investment` to the amounts of ungrouped additional expenses marked `isInvestment`. Annual KPIs, invested-month counts, Evolution and the Excel summary use this shared total. Completed entries still count. Investment totals preserve signed amounts, matching existing rate behavior.

The additional amount is already included in `totalExpenses`; it must not be added to expenses a second time or written into the programmed `investment` field. Changing the flag alone leaves savings, interest, balances and cross-year carry-over unchanged.
