# Feature: Additional Entries

This document describes how variable income and expenses (Additional Entries) are managed.

## Overview

While `YearConfig` handles recurring fixed costs, `Additional Entries` allow users to track granular transactions throughout the month (e.g., a specific dinner, an unexpected gift, or a one-time repair).

## Data Structure

Each entry consists of:
- `label`: A description of the transaction.
- `amount`: The financial value (stored as numeric in DB).
- `type`: Either `income` or `expense`.

## UI & Implementation

- **Components:** `AdditionalEntriesCard` (src/components/monthly/additional-entries-card.tsx) manages the list, creation, editing, deletion, and move affordances for additional entries.
- **Amount inputs:** Creation and edit forms keep numeric text in component state, show an in-input Euro suffix as soon as the amount field is editable, and sanitize typed or pasted text through `sanitizeNumericInput`, keeping only digits plus `,` and `.` decimal separators before parsing the amount sent to the API.
- **API Endpoints:**
    - `POST /api/months/[monthId]/entries`: Create a new entry.
    - `PATCH /api/months/[monthId]/entries/[entryId]`: Edit an entry label/amount or move it to another month by sending `monthId`.
    - `DELETE /api/months/[monthId]/entries/[entryId]`: Remove an entry.
- **Moving Entries:** In editable monthly views, additional income and expense rows can be moved to another month in the same year from the entry edit row's "Move to month" menu. Desktop users can also drag an entry onto another month in the month strip. Moving changes the entry's owning month only; it does not copy or duplicate the entry.
- **Moving Expense Groups:** A grouped expense collection can be moved as a whole to another month in the same year from the group header's "Move group to month" menu or by dragging the group header onto the target month. The group and all child entries are moved together.
- **Integration:** The sum of all additional income and expenses is automatically factored into the `totalIncome` and `totalExpenses` calculations in `src/lib/calculations.ts`.

## Year Summary View

The year summary page displays average additional entries alongside the Balance and Savings charts:
- **Average Additional Expenses per Month:** Total of all additional expenses across all 12 months, divided by 12.
- **Average Additional Income per Month:** Total of all additional incomes across all 12 months, divided by 12.

These statistics appear as two stat cards on the year summary page, providing a quick view of typical monthly variable transactions.

The annual KPI header also includes an **Expected Entries** dialog for temporary, local-only income or expense estimates that adjust the summary projection without writing to the database. The dialog stores entries in year-scoped `localStorage`; when no expected entries exist, it renders an explicit empty state with copy pointing users to the add form instead of placeholder skeleton rows, so the empty state is not mistaken for loading.

**Relevant Code:**
- `avgAdditionalEntriesPerMonth()` in `src/lib/additional-entries.ts`: Calculates the yearly average for a given entry type (includes grouped entries for expense type).
- `AdditionalEntriesAverages` component in `src/components/annual/additional-entries-averages.tsx`: Renders the stat cards with currency formatting and tone-coded icon indicators (rose/ArrowDownRight for expenses, emerald/ArrowUpRight for income, neutral/Minus when the value is zero).
- `ExpectedEntriesDialog` component in `src/components/annual/expected-entries-dialog.tsx`: Renders the expected-entry list, empty state, and add/delete controls used by the annual KPI header dialog.

## Expense Groups

Users can group related additional expenses within a month (e.g., "Viaje a Roma"). Groups are expenses-only and per-month.

### Data
- `additionalEntryGroups` table: `id`, `monthId`, `label`, `createdAt`. Cascade-deleted with their month.
- `additionalEntries.groupId` (nullable FK → `additionalEntryGroups`): `null` = ungrouped.
- `MonthData.additionalExpenses` contains only **ungrouped** expenses. `MonthData.additionalExpenseGroups` contains grouped expenses with their entries nested inside.
- Both sets are summed into `totalExpenses` (see `calculations.ts`).

### API
- `POST /api/months/[monthId]/entry-groups` — create a group `{ label }`.
- `PATCH /api/months/[monthId]/entry-groups/[groupId]` — rename `{ label }`, tag `{ label, tagId }`, or move the full group with `{ monthId }`.
- `DELETE /api/months/[monthId]/entry-groups/[groupId]` — delete group and all its entries (DB cascade).
- `PATCH /api/months/[monthId]/entries/[entryId]` — accepts `groupId: number | null` to move an entry into or out of a group.

### UI
- **`AdditionalEntryGroupRow`** (`src/components/monthly/additional-entry-group-row.tsx`): self-contained collapsed/expanded group row. Owns its own UI state (collapsed, rename, add-entry form, per-entry edit/delete).
- Groups render above ungrouped entries in `AdditionalEntriesCard`.
- Groups can be moved to another month from the group header. Desktop drag-and-drop and the compact month menu both persist through `PATCH /api/months/[monthId]/entry-groups/[groupId]` with a target `monthId`.
- Creating a group updates the mounted month state immediately, then calls `router.refresh()` to invalidate the App Router client cache for route restores after leaving and returning to the year workspace.
- Collapsed state resets on reload (UI-only state, not persisted).
- Group name is editable inline: click the group label to rename, Enter or blur to save, Escape to cancel.
- Deleting a group opens a confirmation dialog listing the group name and entry count.
- Entries can be moved to/from groups via the compact row-level group menu (available in both `AdditionalEntryGroupRow` and `AdditionalEntriesCard`), keeping edit forms focused on label and amount only.
- The shared `EntryFormRow` keeps its mobile action toolbar flush between icon actions and Save/Cancel so tag, recurring, month move, and group move controls can fit in one row.

## Recurring Entries

Any **ungrouped** additional entry (income or expense) can be marked as recurring. When the next year is created, all recurring entries from the previous year are automatically copied into the same month number in the new year, preserving label, amount, type, `isRecurring = true`, and `tagId` (so any assigned tag carries over too).

- **Toggle:** A repeat-icon button in the add/edit form marks or unmarks an entry as recurring. The button is not shown for entries inside expense groups (`AdditionalEntryGroupRow` does not pass `recurringAction` to `EntryFormRow`).
- **Visual indicator:** Recurring entries show an "anual" pill badge after their label in the list view.
- **Amount carry-over:** The amount is read from the source entry at the moment the new year is created (not fixed at time of marking).
- **Schema:** `additionalEntries.isRecurring` (`boolean NOT NULL DEFAULT false` in `src/db/schema.ts`).
- **Year creation hook:** Implemented as step 4b in `createAndPrefillYear` in `src/lib/server/actions/years.ts`. Runs after monthly recurring expenses are linked and before carry-over propagation.
