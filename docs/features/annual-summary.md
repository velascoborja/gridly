# Feature: Annual Summary

The annual summary is the in-year overview shown at `/{locale}/{year}/summary`. It reuses the same `YearPageClient` state as monthly management, so local month edits and annual setup changes stay reflected in the KPI cards and charts without a full client-side refetch.

`AnnualView` is a separate `next/dynamic` client chunk within `YearPageClient`. Month routes therefore do not include the annual UI or Recharts in their initial JavaScript; opening the summary for the first time renders an in-shell skeleton until the chunk is available. Direct summary visits retain server rendering and load the annual chunk immediately, while later in-year switches reuse the cached chunk and shared `YearData`.

## Hero KPI Card

The main card shows the final balance and total savings for the selected year.

- **Final balance:** December ending balance, adjusted by expected entries when any are present.
- **Total savings:** Sum of savings across months with activity, adjusted by expected entries when any are present.
- **Expected entries:** Stored in browser local storage per account and year and displayed as estimate annotations in the hero card. Public demo projections use a separate namespace, and account projection keys are cleared after logout or account deletion.

### Savings Rate

Below the Total savings description, the card shows the annual savings rate with one localized decimal place, replacing the active-month count. Its label is muted; the percentage uses positive, negative, or neutral comparison colors. When expected entries exist, the label explicitly identifies the rate as estimated, followed by the base savings amount without expected entries.

The numerator is the displayed total savings, including expected income minus expected expenses. The denominator is the sum of `totalIncome` across all loaded months, including configured future months, plus expected income. Expected expenses only affect the numerator. The starting balance is not income, and investment remains an expense rather than being added back to savings, matching Evolution's cash savings definition.

`src/lib/annual-savings-rate.ts` provides the pure ratio calculation and localized percentage formatter. Zero or negative adjusted income produces `null`, displayed as `—`; zero savings with positive income displays 0.0%, and negative rates or rates above 100% are preserved. The rate is an annual aggregate, not an average of monthly percentages.

`KpiCards` derives the value directly from its existing props during render, so edits to months, annual setup, and expected entries update it immediately without additional requests or stored state. Without expected entries, its displayed rate matches Evolution for the same full year.

### Investment Rate

Immediately below the savings rate, the Total savings block also shows the annual investment rate. It uses the same localized one-decimal percentage format, muted label, and positive/negative/neutral value colors. The label becomes estimated whenever expected entries are present.

The numerator is the sum of programmed investments and ungrouped additional expenses marked `isInvestment` across all loaded months, including configured future months. The Total invested KPI and its invested-month count use the same shared `totalMonthlyInvestment` helper. The denominator is the same adjusted annual income used by the savings rate, including expected income when expected entries exist. Expected expenses do not affect the investment rate. `src/lib/annual-investment-rate.ts` exports `calculateInvestmentRate`, shared with Evolution's chart; without expected entries, both screens show the same investment rate. Income that is null, zero or negative produces `null`, displayed as `—`; zero investment with positive income displays 0.0%, and negative rates or rates above 100% are preserved. The value is derived during render, so edits update it immediately without additional requests or stored state.

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

The Fixed expenses dialog groups annual fixed spend into home expense, net personal spending (budget minus surplus), and recurring expenses. Expanding a row shows the chronological monthly drilldown. Month headers show a subtotal when that month contains more than one visible expense row, so recurring-expense months with multiple items can be read without manual addition.

## Monthly Balance Chart

The month-by-month balance chart plots each month's ending balance. Its Y axis is derived from the visible balance range with a small rounded margin, instead of always anchoring at zero, so high-balance years still show monthly movement without excessive empty space below the line.

`AnnualView` passes the selected calendar year into `BalanceChart`, which compares it with the browser's current date to identify the current month. The line keeps a single consistent color, while only the current month's dot is emphasized with a subtle animated halo.

When the viewed year is the current calendar year, the X-axis tick for the current month is also highlighted with primary-colored text and a small dot, so the temporal position remains visible even before reading the line marker.

## Monthly Savings Chart

The monthly savings chart plots each month's net savings as bars. Positive months stay green and negative months stay red so the savings direction remains the primary signal. `AnnualView` also passes the selected calendar year into `SavingsChart`; when the viewed year matches the browser's current year, the current month bar receives a subtle primary-colored outline and glow, and the tooltip labels it as the current month.

Negative-month abbreviations on the X axis use the same red status color as their bars. This negative-state color takes priority over the primary-colored current-month label, while the small primary dot beneath the label continues to identify the current month.

## Personal Surplus Warnings and Adjustments

A localized warning lists every month whose surplus is outside its personal budget. Personal fixed-expense drilldowns use net spending and retain negative legacy adjustments, including categories that cancel to zero across months. Bar widths stay within 0–100%. Months with negative totals or savings remain included in savings KPIs. Income totals and savings-rate denominators exclude personal surplus; cash savings are unchanged.
