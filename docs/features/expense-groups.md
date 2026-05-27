# Feature: Expense Groups

## Overview

Expense Groups let users organize related additional expenses within a month under a named heading (e.g., "Viaje a Roma", "Reforma cocina"). Groups are expense-only and scoped to a single month — they do not persist across months or years.

## Data Model

Two tables are involved:

| Table | Key columns | Notes |
|---|---|---|
| `additional_entry_groups` | `id`, `month_id`, `label`, `tag_id`, `created_at` | `tag_id` nullable FK → `tags.id`, `onDelete: set null`; cascade-deleted when the month is deleted |
| `additional_entries` | …, `group_id` (nullable FK → `additional_entry_groups`) | `null` = ungrouped |

- `group_id` is nullable; a `null` value means the entry is ungrouped.
- Deleting a group cascades to all its entries (DB `ON DELETE CASCADE`).
- An entry can belong to at most one group.
- `tag_id` on a group is nullable. When set, all entries in the group carry the same `tagId` value as the group.

### How `MonthData` represents groups

- `MonthData.additionalExpenses` — ungrouped expenses only.
- `MonthData.additionalExpenseGroups` — array of groups, each with a nested `entries` array.
- Both sets are summed together when computing `totalExpenses` in `src/lib/calculations.ts`.

## API

| Method | Route | Purpose |
|---|---|---|
| `POST` | `/api/months/[monthId]/entry-groups` | Create a group `{ label }` |
| `PATCH` | `/api/months/[monthId]/entry-groups/[groupId]` | Rename a group `{ label }` or set its tag `{ label, tagId: number \| null }`. When `tagId` is present, all entries in the group are batch-updated to the same `tagId`. |
| `DELETE` | `/api/months/[monthId]/entry-groups/[groupId]` | Delete group and all its entries (DB cascade) |
| `POST` | `/api/months/[monthId]/entries` | Create an entry; accepts optional `groupId` to assign it directly into a group |
| `PATCH` | `/api/months/[monthId]/entries/[entryId]` | Accepts `groupId: number \| null` to move an entry into or out of a group |

**Important:** The entries `POST` route must receive `groupId` in the request body and forward it to the DB insert. Omitting it results in the entry being saved as ungrouped (`group_id = NULL`) even though the client shows it inside the group (optimistic UI). This was a bug that was fixed — the test `entries POST route persists groupId to the database insert` guards against regression.

## Key Components

- **`AdditionalEntryGroupRow`** (`src/components/monthly/additional-entry-group-row.tsx`): self-contained group row. Owns collapsed/expanded UI state, inline group rename, add-entry form, per-entry edit/delete, and move-to-group dropdown.
- **`AdditionalEntriesCard`** (`src/components/monthly/additional-entries-card.tsx`): parent card that renders groups above ungrouped entries. Handles group creation and the move-to-group menu for ungrouped entries.

## UI Behaviour

### Creating a group
- Click "Añadir grupo" in the expenses card footer.
- Enter a name and confirm. The card's state updates immediately via optimistic update. No `router.refresh()` is needed — Next.js 16 sets `staleTimes.dynamic = 0`, so dynamic pages are never cached client-side; fresh data is always fetched from the server on navigation.

### Adding an entry to a group
- Expand the group row and click "Añadir al grupo".
- Label and amount are required. On save, a `POST /api/months/[monthId]/entries` request is sent with `{ type: "expense", label, amount, groupId }`.
- The group's entry list is updated optimistically in client state.

### Moving entries between groups
- In both `AdditionalEntryGroupRow` (for grouped entries) and `AdditionalEntriesCard` (for ungrouped entries), the edit-row exposes a compact `DropdownMenuRadioGroup` with a `FolderInput` icon.
- Selecting a target group sends `PATCH /api/months/[monthId]/entries/[entryId]` with `{ groupId: <targetId> }`.
- Selecting "Sin grupo" sends `{ groupId: null }` to ungroup the entry.
- Moving uses a per-entry `movingToGroupId` loading flag rather than a generic busy state.

### Renaming a group
- Click the group label text to enter inline rename mode.
- Enter / blur saves; Escape cancels.
- Sends `PATCH /api/months/[monthId]/entry-groups/[groupId]` with `{ label }`.

### Deleting a group
- The group header has a trash icon that opens an `AlertDialog` confirming the group name and entry count.
- On confirm, sends `DELETE /api/months/[monthId]/entry-groups/[groupId]`. The DB cascade removes all child entries.

### Setting a group tag
- The group header shows a tag icon button (a `TagPicker`) between the entry count and the total amount.
- On mobile, the group header uses tighter spacing between trailing controls so longer group names keep more horizontal room.
- When a tag is assigned, a colored chip is also shown in the header.
- Selecting a tag sends `PATCH /api/months/[monthId]/entry-groups/[groupId]` with `{ label, tagId }` and batch-updates all entries in the group to the same tag.
- New entries added to the group automatically receive the group's tag.
- Entries moved into the group receive the destination group's tag.
- Moving an entry out of the group leaves its `tagId` unchanged.

### Collapsed state
- Groups render collapsed by default. State is UI-only and resets on page reload.
- Collapsed state is lifted to `AdditionalEntriesCard` (a `Record<groupId, boolean>` map) and passed to each `AdditionalEntryGroupRow` as `collapsed` / `onCollapsedChange` props. This allows the card to coordinate all groups atomically for bulk expand/collapse.
- If a highlighted entry (from search/navigation) belongs to a group, the group auto-expands via a `useEffect` watching `highlightId`.
- `Cmd+Shift+.` expands all groups if any are collapsed, or collapses all if every group is already expanded. See [Keyboard Shortcuts](keyboard-shortcuts.md).

## Calculations

Grouped expenses are included in `totalExpenses` alongside ungrouped entries:

```ts
// src/lib/calculations.ts
const groupedExpensesTotal = additionalExpenseGroups.reduce(
  (sum, g) => sum + g.entries.reduce((s, e) => s + e.amount, 0),
  0
);
totalExpenses = homeExpense + personalExpense + investment
  + recurringExpensesTotal
  + additionalExpensesTotal   // ungrouped
  + groupedExpensesTotal;     // grouped
```

## Tests

`src/app/api/months/[monthId]/entries/route.test.ts` contains three source-inspection tests covering the bug-prone data path:

1. `entries POST route reads groupId from the request body` — ensures `groupId` is destructured from the body.
2. `entries POST route persists groupId to the database insert` — ensures `groupId ?? null` reaches the DB insert.
3. `group row add-entry handler sends groupId in the POST body` — ensures the `AdditionalEntryGroupRow` component includes `groupId` in its `POST` payload.
