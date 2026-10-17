# Feature: Year Movements

## Overview

The read-only **Yearly movements** screen is opened from the Annual summary's **Yearly movements** button at `/{locale}/{year}/movements`. The Year tab stays active. Users can switch between additional expenses (default) and additional income and compare the twelve months in chronological order.

The public demo exposes the same screen at `/{locale}/demo/{year}/movements`, using the canonical demo year and fictional data. Its return link stays within the demo.

## Key Components and Data

- `YearMovementsView` renders the annual total, peak month(s), monthly headers, comparison bars, grouped expense subtotals and entry breakdowns.
- `summarizeYearMovements` in `src/lib/year-movements.ts` derives the totals from `MonthData`. Expenses include ungrouped entries and each group's children exactly once. Income includes only `additionalIncomes`.
- Salaries, extra payslips, interest, home/personal expenses, monthly investment and fixed recurring expenses are excluded from movement totals. Additional entries marked as annually recurring are included normally.
- Completed and incomplete entries both count. Recorded future-month entries also count; future monthly headers show a Planned badge. Expected Entries stored locally in the Annual summary are excluded.
- The monthly result label is Savings for positive or zero results and Loss for negative results. The balance label is Balance at month end. These figures are displayed with lower visual priority and come directly from the existing financial engine's computed month data. Switching movement type does not change these values.

## Implementation Details

`YearPageClient` loads the screen as a separate dynamic client chunk with an immediate `YearViewLoading` skeleton. It passes the current shared `YearData`, so monthly edits remain visible without a new API request. Direct visits authenticate and load the year using the same server helpers as the Annual summary. Missing years return 404.

Opening the screen and returning to the summary use real localized links with optional local navigation callbacks. When a callback exists, `onNavigate` prevents the framework transition and the year shell updates the URL with native history. Modifier-key clicks keep normal browser behavior. Shared year-route utilities handle parsing, localized/demo prefixes, URL building and setup return destinations. Both desktop and mobile year menus preserve the movements view when changing years; historical summary-only imports continue to open Evolution.

All months start expanded. Each monthly header toggles its breakdown with `aria-expanded` and `aria-controls`; Expand all and Collapse all operate synchronously. Expansion is independent of movement type and persists while switching the selector. Leaving and re-entering the screen or changing the year resets expansion and selects expenses.

Monthly headers stick within their own month section. `BaseAppShell` measures its header using `ResizeObserver` and exposes `--app-sticky-header-height` on its root. This is the header height when it is sticky and zero otherwise, including mobile. The demo falls back to zero. Month sections do not clip overflow, so sticky positioning works with normal document scrolling.

Peak selection considers months containing entries and marks all tied maxima, allowing floating-point tolerance for decimal amounts. Empty years have no peak; zero-value recorded entries remain distinct from empty months. Comparison bars use absolute magnitude for width, remain within 0–100%, and retain signed displayed totals. Each expense group appears as one row with its name, a localized Group badge and its full subtotal; its children are not rendered. Empty groups are omitted. Entries are sorted by amount descending without changing shared arrays.

All copy lives under `Annual.movements`, `Annual.movementsButton` and `Demo.movements` in both Spanish and English message files. Layout follows the existing design tokens and financial-number formatting.

## Verification

`src/lib/year-movements.test.ts` covers grouped totals, type separation, future/completed entries, chronological output, financial context preservation, ties, negative and zero values, empty years and updated shared data. Route tests cover locale/demo prefixes and setup return destinations. `tests/year-movements-source.test.mjs` checks shared-state navigation, loading boundaries, accessible interaction contracts, year selectors, translated copy and documentation registration.


## Responsive Summary Action

Below 640px the Annual summary exposes movements as an accessible icon-only link alongside its settings, tags and other icon actions. In editable years, all five icon controls and Export share one non-wrapping row, with Export filling the remaining width at the same height. Below 480px Export shows only the download icon, retains its full localized accessible name and title, and the row uses 4px gaps; from 480px its text label is also visible. From 640px movements is a labeled text-and-icon link without a visible border, background or shadow, retaining keyboard focus feedback. The public demo retains access in both presentations. Both links preserve the existing local-navigation callback and real href.
