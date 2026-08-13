# Feature: Annual Summary

The annual summary is the in-year overview shown at `/{locale}/{year}/summary`. It reuses the same `YearPageClient` state as monthly management, so local month edits and annual setup changes stay reflected in the KPI cards and charts without a full client-side refetch.

## Hero KPI Card

The main card shows the final balance and total savings for the selected year.

- **Final balance:** December ending balance, adjusted by expected entries when any are present.
- **Total savings:** Sum of savings across months with activity, adjusted by expected entries when any are present.
- **Expected entries:** Stored in browser local storage per account and year and displayed as estimate annotations in the hero card. Public demo projections use a separate namespace, and account projection keys are cleared after logout or account deletion.

## Comparison Lines

The hero KPI card adds extra context from Evolution metrics:

- Under **Total savings**, the card shows the difference versus the previous available year and versus the multi-year average.
- Under **Final balance**, the card shows the percentage change versus the previous available year.
- Comparison line labels stay muted; only the amount or percentage fragment receives the green/red/neutral comparison color.
- The previous baseline prefers the exact previous calendar year. If it does not exist, Gridly uses the nearest earlier registered Evolution year. If no earlier year exists, the previous-year line is hidden.
- The average baseline uses all Evolution metrics except the viewed year, including summary-only historical imports.
- If expected entries are present, comparison lines use the same displayed estimate as the large KPI value.
- The final-balance percentage line is hidden when the previous final balance is zero.

Annual savings follows the Evolution definition: cash balance growth, with investment tracked separately because Gridly counts monthly investment inside expenses.

The month and summary server routes load this comparison context through `getAnnualKpiComparisonContextForUser`. The helper uses four grouped queries for configured years/months, additional-entry totals, recurring-expense totals, and historical summaries. It excludes the viewed year's month-level rows because that year is not part of either comparison baseline, and it does not hydrate full `YearData`, tags, groups, or recurring templates for the other years. The compact calculation shares the same month-chain financial primitive as the full year loader, including automatic and manually overridden interest behavior.

## Fixed Expenses Drilldown

The Fixed expenses dialog groups annual fixed spend into home expense, personal budget, and recurring expenses. Expanding a row shows the chronological monthly drilldown. Month headers show a subtotal when that month contains more than one visible expense row, so recurring-expense months with multiple items can be read without manual addition.

## Monthly Balance Chart

The month-by-month balance chart plots each month's ending balance. Its Y axis is derived from the visible balance range with a small rounded margin, instead of always anchoring at zero, so high-balance years still show monthly movement without excessive empty space below the line.

`AnnualView` passes the selected calendar year into `BalanceChart`, which compares it with the browser's current date to identify the current month. The line keeps a single consistent color, while only the current month's dot is emphasized with a subtle animated halo.

When the viewed year is the current calendar year, the X-axis tick for the current month is also highlighted with primary-colored text and a small dot, so the temporal position remains visible even before reading the line marker.

## Monthly Savings Chart

The monthly savings chart plots each month's net savings as bars. Positive months stay green and negative months stay red so the savings direction remains the primary signal. `AnnualView` also passes the selected calendar year into `SavingsChart`; when the viewed year matches the browser's current year, the current month bar receives a subtle primary-colored outline and glow, and the tooltip labels it as the current month.

The savings chart uses the same X-axis current-month tick treatment as the balance chart: the current month abbreviation turns primary-colored and gets a small dot beneath it.
