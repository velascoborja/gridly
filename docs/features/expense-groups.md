# Feature: Expense Groups

## Overview

Expense Groups let users organize related additional expenses within a month under a named heading (e.g., "Viaje a Roma", "Reforma cocina"). Groups are expense-only and scoped to a single month — they do not persist across months or years.

## Data Model

Two tables are involved:

| Table | Key columns | Notes |
|---|---|---|
| `additional_entry_groups` | `id`, `month_id`, `label`, `is_completed`, `tag_id`, `created_at` | `is_completed` defaults to `false`; `tag_id` nullable FK → `tags.id`, `onDelete: set null` |
| `additional_entries` | …, `group_id` (nullable FK → `additional_entry_groups`), `is_completed` | `null` group = ungrouped; `is_completed` defaults to `false` |

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
| `PATCH` | `/api/months/[monthId]/entry-groups/[groupId]` | Rename a group `{ label }`, set its tag `{ label, tagId: number \| null }`, or move the full group to another month in the same year with `{ monthId }`. When `tagId` is present, all entries in the group are batch-updated to the same `tagId`; when `monthId` is present, the group and all child entries are batch-updated to the target month. |
| `DELETE` | `/api/months/[monthId]/entry-groups/[groupId]` | Delete group and all its entries (DB cascade) |
| `POST` | `/api/months/[monthId]/entries` | Create an entry; accepts optional `groupId` to assign it directly into a group |
| `PATCH` | `/api/months/[monthId]/entries/[entryId]` | Accepts `groupId: number \| null` to move an entry into or out of a group |

Both item `PATCH` routes also accept `{ isCompleted: boolean }`. Completed resources only accept the exact reopen mutation `{ isCompleted: false }`; other changes and deletion return `409 { error: "completed_locked" }`. Creating or moving an entry into a completed group is rejected with the same response.

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

### Moving groups between months
- Expense groups can be moved as a whole to another month in the same year.
- Desktop users can drag the group header onto a different month in the month strip.
- Touch and keyboard users can use the group header's compact "Move group to month" menu.
- The move sends `PATCH /api/months/[monthId]/entry-groups/[groupId]` with `{ monthId: targetMonthId }`.
- The API validates that the target month belongs to the same year and account, updates `additional_entry_groups.month_id`, and updates every child `additional_entries.month_id` for the group.
- `MonthOverview` then removes the group from the source month, adds it to the target month, and recomputes the month chain without calling `router.refresh()`.

### Renaming a group
- Click the group label text to enter inline rename mode.
- Enter / blur saves; Escape cancels.
- Sends `PATCH /api/months/[monthId]/entry-groups/[groupId]` with `{ label }`.

### Deleting a group
- The group header has a trash icon that opens an `AlertDialog` confirming the group name and entry count.
- On confirm, sends `DELETE /api/months/[monthId]/entry-groups/[groupId]`. The DB cascade removes all child entries.

### Setting a group tag
- The group header shows a tag icon button (a `TagPicker`) between the entry count and the total amount.
- The entry count remains visible in the group header on every viewport size.
- On mobile, the tag picker and move-to-month menu are hidden from the header so longer group names have more horizontal room. They appear in a compact, single-line action row above the expanded group's expense entries, grouped from the left edge with a small horizontal inset. Below 480px, the tag control keeps its icon and truncated text while the move and add actions become icon-only controls with accessible labels and tooltips; from 480px upward, all icon-and-text labels return. Loading indicators remain visible as action feedback.
- The mobile action row is also the only visible "Add entry to group" trigger on mobile. It opens the existing local add-entry form immediately and disables itself while that form is open; the standalone trigger below the entries remains desktop-only.
- When a tag is assigned, a colored chip is shown in the desktop header and the mobile action row.
- Selecting a tag sends `PATCH /api/months/[monthId]/entry-groups/[groupId]` with `{ label, tagId }` and batch-updates all entries in the group to the same tag.
- New entries added to the group automatically receive the group's tag.
- Entries moved into the group receive the destination group's tag.
- Moving an entry out of the group leaves its `tagId` unchanged.

### Collapsed state
- Groups render collapsed by default. State is UI-only and resets on page reload.
- The group header keeps a uniform 48px minimum height at every breakpoint across incomplete, pending, and completed states.
- Collapsed state is lifted to `AdditionalEntriesCard` (a `Record<groupId, boolean>` map) and passed to each `AdditionalEntryGroupRow` as `collapsed` / `onCollapsedChange` props. This allows the card to coordinate all groups atomically for bulk expand/collapse.
- If a highlighted entry (from search/navigation) belongs to a group, the group auto-expands via a `useEffect` watching `highlightId`.
- `Cmd+Shift+.` expands all groups if any are collapsed, or collapses all if every group is already expanded. See [Keyboard Shortcuts](keyboard-shortcuts.md).

### Completion lock
- A group can be marked completed from its lock action. The group surface and contents become muted while totals remain legible.
- Completing a group locks its name, tag, movement, deletion, add-entry action, and every child entry. Child `isCompleted` values are unchanged, so reopening restores each child's individual state.
- Expanding and collapsing remains available because it does not mutate financial data.
- Completing a group optimistically collapses its body. If completion fails, the prior completion state is restored and the group expands before the localized error is shown; reopening does not automatically expand it.
- Incomplete groups expose their open lock contextually in the expanded body. Completed groups replace header Delete with the authoritative compact closed lock, so reopening remains directly available while the group is collapsed and no duplicate reopen control appears in the body.
- Group deletion remains directly available from the header on desktop and mobile while the group is incomplete. Completed groups hide deletion until they are reopened.
- While a parent group is completed, it also locks every child entry without overwriting each child's `isCompleted` value. After the parent reopens, individually completed child rows expose their compact closed lock directly in the resting row.
- Lock changes are optimistic and retain the same disabled action footprint throughout the request. Pending replaces the lock with a centered spinner; success then articulates only the shackle for 300ms. Reopening keeps the temporary open lock until that confirmation finishes before restoring Delete, without expanding the group. Failures skip confirmation and roll back to the prior state, while reduced-motion users receive the final action immediately.

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
