# Feature: Year Movements

## Overview

The read-only **Yearly movements** screen is opened from the Annual summary's **Yearly movements** button at `/{locale}/{year}/movements`. The Year tab stays active. Users can switch between additional expenses (default) and additional income and compare the twelve months in chronological order (default), highest-total-first or lowest-total-first order.

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

The toolbar exposes an accessible Sort by selector. Its popup opens below the trigger and sizes to its longest option, with the trigger width as a minimum and the available viewport width as a maximum, so translated labels are not clipped when Chronological is selected. Sorting rearranges complete month sections by the signed total of the active movement type, preserving chronological order for ties and counting empty months as zero. It works on copied rows without mutating shared data. Changing movement type preserves the selected order and collapsed months. Entering the screen or changing year restores chronological order.

Below 640px, the toolbar stays on one non-wrapping row with 4px gaps: optional year selector, flexible sort selector, then separate 44×44px Expand all and Collapse all icon buttons. Visible field labels are hidden but remain accessible; action names are provided through localized accessible labels and titles. Selected sort values use compact translations from 360px to 639px and shorter Date/Highest/Lowest labels below 360px. Open sort menus always retain the full option labels and content-based width. At 640px and above, full labels and text buttons are restored.

The mobile year trigger is 68px wide and displays the year number, keeping the full empty-year explanation in its title and option. Initial year loading occupies the same width with a spinner and accessible status. During year navigation, a spinner overlays the disabled year trigger without widening the row. On a load error, a compact retry icon exposes the localized error through its title and accessible description; desktop retains the visible error and retry text.

Monthly header amounts use a proportional black-to-rose-red scale for expenses and black-to-emerald-green for income, recalculating immediately when the movement type changes. Only months with entries establish the minimum and maximum; empty months stay neutral. Equal totals (within the existing decimal tolerance), a single populated month, and empty years remain neutral. In dark mode the neutral endpoint uses the foreground token and the accent endpoint uses rose-400 or emerald-400; light mode uses black and rose-600 or emerald-600. Annual KPIs and comparison bars retain their existing visual roles.

When the account has multiple created Gridly years, `MovementsYearSelector` fetches `GET /api/years?withMovements=true` on mount with cancellation and no browser caching. This optional filter preserves the collection response shape (`{ year, id }[]`) and its default unfiltered behavior. An authenticated, user-scoped `EXISTS` query joins months and additional entries; grouped, completed, future, zero-value and negative entries all count, independently of the selected movement type. Fixed financial fields, empty groups and historical summary-only imports do not qualify.

The in-screen year selector appears only when at least two eligible years exist, ordered newest first. A currently open empty year is represented by a disabled localized option. Loading and retryable errors appear alongside the controls without blocking the movements; year navigation disables the selector and announces its pending state before using the localized router and shared movements route builder. The existing route loading boundary handles destination loading. The shell's general year menus remain available. The public demo does not request account years and offers sorting and color comparison for its single fictional year.

Monthly headers stick within their own month section. `BaseAppShell` measures its header using `ResizeObserver` and exposes `--app-sticky-header-height` on its root. This is the header height when it is sticky and zero otherwise, including mobile. The demo falls back to zero. Month sections do not clip overflow, so sticky positioning works with normal document scrolling.

The current calendar month has a subtle primary-colored header tint, a 2px inset left accent and a localized Current month badge beside its name. Both the viewed year and month must match the local calendar date; past and future years have no current-month marker. The same rule applies to the public demo. The marker remains visible when collapsed and while the header sticks, independently of movement type, sort order, entry count or peak status. The badge wraps with the existing month labels on narrow screens and describes the expand/collapse button through `aria-describedby`. Existing amount colors, comparison bars and peak badges retain their roles. The date is recalculated on render without a background timer or automatic scrolling.

Peak selection considers months containing entries and marks all tied maxima, allowing floating-point tolerance for decimal amounts. Empty years have no peak; zero-value recorded entries remain distinct from empty months. Comparison bars use absolute magnitude for width, remain within 0–100%, and retain signed displayed totals. Each expense group appears as one row with its name, a localized Group badge and its full subtotal; its children are not rendered. Empty groups are omitted. Entries are sorted by amount descending without changing shared arrays.

All copy lives under `Annual.movements`, `Annual.movementsButton` and `Demo.movements` in both Spanish and English message files. Layout follows the existing design tokens and financial-number formatting.

## Verification

`src/lib/year-movements.test.ts` covers grouped totals, type separation, future/completed entries, sorting and chronological ties, financial context preservation, negative and zero values, populated-only color scales, equal totals, empty years and updated shared data. Route tests cover locale/demo prefixes and setup return destinations. `tests/year-movements-source.test.mjs` checks shared-state navigation, loading boundaries, accessible interaction contracts, year eligibility and loading/retry feedback, translated copy and documentation registration.


## Responsive Summary Action

Below 640px the Annual summary exposes movements as an accessible icon-only link alongside its settings, tags and other icon actions. In editable years, all five icon controls and Export share one non-wrapping row, with Export filling the remaining width at the same height. Below 480px Export shows only the download icon, retains its full localized accessible name and title, and the row uses 4px gaps; from 480px its text label is also visible. From 640px movements is a labeled text-and-icon link without a visible border, background or shadow, retaining keyboard focus feedback. The public demo retains access in both presentations. Both links preserve the existing local-navigation callback and real href.
