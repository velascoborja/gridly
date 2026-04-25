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
- It aggregates all income sources (payslip, bonus, additional incomes, interests).
- It aggregates all expense sources (fixed expenses, additional expenses).

## Interest Handling

- **Automatic:** Calculated as `(Starting Balance * YearConfig.interestRate) / 12`.
- **Manual Override:** Users can toggle `interestsManualOverride` to set a specific interest amount for a month, bypassing the automatic calculation. This is useful for high-yield accounts where interests are paid differently.
- **Annual Setup Reapply:** Saving year setup values from the annual summary resets monthly interest overrides and reapplies the annual baseline fields with `applyYearConfigToMonth`, so the annual balance reflects the latest setup immediately.
