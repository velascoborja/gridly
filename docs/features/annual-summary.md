# Feature: Annual Summary

The annual summary is the in-year overview shown at `/{locale}/{year}/summary`. It reuses the same `YearPageClient` state as monthly management, so local month edits and annual setup changes stay reflected in the KPI cards and charts without a full client-side refetch.

## Hero KPI Card

The main card shows the final balance and total savings for the selected year.

- **Final balance:** December ending balance, adjusted by expected entries when any are present.
- **Total savings:** Sum of savings across months with activity, adjusted by expected entries when any are present.
- **Expected entries:** Stored in browser local storage per year and displayed as estimate annotations in the hero card.

## Comparison Lines

The hero KPI card adds extra context from Evolution metrics:

- Under **Total savings**, the card shows the difference versus the previous available year and versus the multi-year average.
- Under **Final balance**, the card shows the percentage change versus the previous available year.
- The previous baseline prefers the exact previous calendar year. If it does not exist, Gridly uses the nearest earlier registered Evolution year. If no earlier year exists, the previous-year line is hidden.
- The average baseline uses all Evolution metrics except the viewed year, including summary-only historical imports.
- If expected entries are present, comparison lines use the same displayed estimate as the large KPI value.
- The final-balance percentage line is hidden when the previous final balance is zero.

Annual savings follows the Evolution definition: cash balance growth, with investment tracked separately because Gridly counts monthly investment inside expenses.

## Fixed Expenses Drilldown

The Fixed expenses dialog groups annual fixed spend into home expense, personal budget, and recurring expenses. Expanding a row shows the chronological monthly drilldown. Month headers show a subtotal when that month contains more than one visible expense row, so recurring-expense months with multiple items can be read without manual addition.

## Monthly Balance Chart

The month-by-month balance chart plots each month's ending balance. Its Y axis is derived from the visible balance range with a small rounded margin, instead of always anchoring at zero, so high-balance years still show monthly movement without excessive empty space below the line.

`AnnualView` passes the selected calendar year into `BalanceChart`, which compares it with the browser's current date to identify the current month. The line keeps a single consistent color, while only the current month's dot is emphasized with a subtle animated halo.
