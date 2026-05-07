# Feature: Historical Year Imports

Historical year imports are summary-only historical imports used by the Evolution dashboard. They let users represent years tracked outside Gridly without creating annual configuration, monthly rows, recurring expenses, exports, or balance carry-over links.

## Eligibility

Imports are allowed only when the user already has at least one full Gridly year. The imported year must be before the earliest full Gridly year, must not overlap a full Gridly year, and must not duplicate another historical import for the same user.

## Stored Fields

Historical imports store `year`, `startingBalance`, `finalBalance`, and `investedAmount`. `savedAmount` is derived as `finalBalance - startingBalance`, so negative savings are valid. `investedAmount` must be zero or greater.

## Evolution Behavior

Evolution merges historical imports and full Gridly years in chronological order. Historical rows contribute to final balance, saved amount, invested amount, accumulated invested amount, total saved, and total wealth. Historical rows do not have monthly income, monthly expenses, or savings-rate data, so those fields are shown as unavailable.

The Evolution route remains reachable when a user has only one full Gridly year. In that state, the dashboard shows an empty state with the add-historical-year action so users can create the historical comparison source they need.

## Non-Effects

Historical imports do not create months, recurring expenses, setup configuration, annual exports, or carry-over propagation. Editing or deleting a historical import only changes Evolution history.
