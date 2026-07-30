# Feature: Monthly Management

This document describes the core monthly tracking interface and logic in Gridly.

## Overview

The Monthly View (`/locale/[year]/[month]`) is the primary workspace for users. It allows tracking income, fixed expenses, and monitoring the monthly financial health.

## Key Components

- **Income Card:** Displays net salary (`payslip`), extra payments (`additionalPayslip`), generated interests, and personal surplus (`personalRemaining`).
- **Fixed Expenses Card:** Tracks recurring costs such as housing (`homeExpense`), personal budget (`personalExpense`), and investments (`investment`).
- **Recurring Expenses Section:** Shows named planned expenses copied from the year template inside the Fixed Expenses card. Users can edit or delete rows for the current month only.
- **Summary Card:** Provides a real-time breakdown of `Total Income`, `Total Expenses`, and the resulting `Savings`.
- **Month Chain:** Shows the `Starting Balance` (inherited from the previous month) and the `Ending Balance` (starting balance + savings).
- **Year-End Projection:** For January through November, the monthly header shows a subtle projected December balance next to the month status on desktop and underneath it on smaller screens, using the same recomputed month chain.

## Logic & Interactions

### Data Persistence
- Client-side edits to fields (e.g., `payslip`, `homeExpense`) are saved via `PATCH /api/months/[monthId]`.
- Fixed income and expense edit inputs keep numeric text in component state, show an in-input Euro suffix once a value is entered, and sanitize typed or pasted text through `sanitizeNumericInput`, keeping only digits plus `,` and `.` decimal separators before parsing the amount sent to the API.
- Additional income and expense entry amount inputs also accept temporary arithmetic expressions such as `20+30+40`, `(12,50+8,25)*2`, or `100/4`. The expression is evaluated client-side for preview and save, but only the final numeric value is persisted.
- Setup-backed monthly fields track explicit manual override flags: `payslipManualOverride`, `additionalPayslipManualOverride`, `homeExpenseManualOverride`, `personalExpenseManualOverride`, and `investmentManualOverride`. User edits set the related flag to `true`; reset actions clear it to `false`.
- Recurring expense edit/delete operations are saved via `/api/months/[monthId]/recurring-expenses/[entryId]`.
- Additional income and expense entries can be moved between months from the month view. The edit row exposes a "Move to month" menu for touch and keyboard-friendly movement, while desktop drag-and-drop onto a different month tab remains available as a shortcut. Both paths persist through `PATCH /api/months/[monthId]/entries/[entryId]` with a target `monthId`.
- Additional income, expense, and expense-group rows can be completed once the expected transaction occurs. Completing an entry closes its editor through a shared 200ms measured-height transition; completing a group collapses its body. Entry resting rows retain a stable 40px minimum height and identical amount/action footprints across idle, pending, and confirmation states. Failed completion reverses the transition and restores the prior open view so the existing error remains visible, while reopening does not auto-expand. Completed entries replace Delete with a compact closed lock in the resting row, and completed groups use the authoritative header lock. During the optimistic request, a centered spinner replaces the lock icon without changing the action footprint. A successful response then articulates the lock shackle for 300ms; reopening keeps the temporary open lock in place until that confirmation finishes before restoring the normal row or header action. Reduced-motion users receive the final state immediately without height or shackle animation. Group headers keep a uniform 48px height across breakpoints, and a completed group still locks its child entries without overwriting their individual completion state.
- Additional expense groups can also be moved as a whole to another month in the same year. The group header exposes a compact "Move group to month" menu and can be dragged onto a month tab on desktop. The API updates both the group and all child entries to the target month.
- After most successful monthly mutations, `MonthOverview` recomputes the full month chain and lifts the updated `YearData` to `YearPageClient`, preserving the mounted client state while navigating between months. No `router.refresh()` is called — Next.js 16 sets `staleTimes.dynamic = 0`, so dynamic pages are never cached in the client router cache and always fetch fresh data from the server on navigation.
- Because the full month chain is recomputed after edits, the projected year-end balance displayed in the month status area updates immediately without switching to the Annual Summary tab.
- The fixed-values show/hide toggle renders both localized labels in the same layout cell and switches visibility only, keeping the month header width stable when the panel is expanded or collapsed.
- Each editable month header exposes a Markdown export action. It downloads `GET /api/years/[year]/months/[month]/export`, generating a single-month `.md` file that follows the visible monthly template sections: next-month expenses, fixed expenses, current-month expenses, income, and current balance.
- The UI uses optimistic updates or instant feedback to ensure a smooth experience.

### Month Navigation
- Month, summary, and settings switches inside `YearPageClient` update local React state and call `window.history.pushState()`. All URL generation uses the shared utilities in `src/lib/year-routes.ts`. Next.js 16 integrates native history updates with router state, so the URL changes without forcing a new server navigation for each month.
- `Cmd/Ctrl+Shift+K` opens a direct month palette from the monthly, annual-summary, or settings view within the loaded year. The palette shows all 12 months before typing, filters localized names by normalized prefix, and routes arrow-key, Enter, or pointer selection through the same local `handleMonthSelect` path.
- Opening or switching to the current calendar year defaults the monthly view to the current calendar month. Opening or switching to any other year defaults to January so historical/future years start from the beginning of that year instead of inheriting today's month.
- When a selected month is not the current calendar month, the month header shows a compact shortcut back to the current month. The arrow points right from past months and left from future months to indicate the direction of travel.
- On mobile viewports, `MonthOverview` also supports horizontal swipe navigation across months. The gesture uses `getHorizontalSwipeDirection` from `src/lib/mobile-swipe.ts`, ignores short or mostly vertical gestures, and calls the same local `onMonthSelect` handler used by the month strip so the mounted `YearData` is reused.
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
- Fixed income and expense fields expose reset actions only when their explicit manual override flag is set. Salary and extra pay reset to the annual setup values, fixed expenses reset to their annual setup values, interest resets to the calculated value and clears `interestsManualOverride`, and personal surplus resets to `0` when it has a non-zero value.

### Spanish Employment Conventions
- **Extra Pays:** In Spain, net salary is often paid in 14 payments. Gridly automatically handles this by prefilling `additionalPayslip` in June (Month 6) and December (Month 12) if the year is configured with extra payments.
