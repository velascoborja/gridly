# Additional Expense Groups

**Date:** 2026-05-17
**Status:** Approved

## Overview

Allow users to group related additional expenses within a month (e.g. "Viaje a Roma", "Material oficina"). Groups are expenses-only, per-month, expandable/collapsible, and always rendered above ungrouped entries. Deleting a group deletes all its entries. Collapsed/expanded state is UI-only and resets on reload.

---

## Data Model

### New table: `additionalEntryGroups`

| Column | Type | Notes |
|---|---|---|
| `id` | serial PK | |
| `monthId` | integer FK → `months.id` | cascade delete |
| `label` | text | group name |
| `createdAt` | timestamp | |

### Modified table: `additionalEntries`

Add a nullable column:

```
groupId  integer FK → additionalEntryGroups.id  ON DELETE CASCADE
```

`null` means ungrouped. The cascade ensures that deleting a group at the DB level removes all its entries automatically.

### Modified type: `AdditionalEntryGroup` (new, `src/lib/types.ts`)

```ts
export interface AdditionalEntryGroup {
  id: number;
  monthId: number;
  label: string;
  entries: AdditionalEntry[];
}
```

`MonthData` gains:

```ts
additionalExpenseGroups: AdditionalEntryGroup[];
```

Ungrouped expenses remain in `additionalExpenses` as today. Groups are expenses-only — `additionalIncomes` and `additionalIncomeGroups` do not exist.

---

## API Routes

### New: Group CRUD

| Method | Path | Body | Action |
|---|---|---|---|
| `POST` | `/api/months/[monthId]/entry-groups` | `{ label: string }` | Create a group |
| `PATCH` | `/api/months/[monthId]/entry-groups/[groupId]` | `{ label: string }` | Rename group |
| `DELETE` | `/api/months/[monthId]/entry-groups/[groupId]` | — | Delete group + all its entries |

All routes require the authenticated user to own the month (use the existing `getOwnedMonth` helper). DELETE relies on DB cascade — no need to explicitly delete entries in the API handler.

### Modified: Entry PATCH

`PATCH /api/months/[monthId]/entries/[entryId]` accepts an additional optional field:

```ts
groupId?: number | null
```

`null` moves the entry to ungrouped. A valid group id assigns it to that group. The group must belong to the same month; the API validates this.

### Month data response

The existing month data endpoint returns `additionalExpenseGroups` alongside `additionalExpenses`. Each group object includes its nested entries (already-parsed amounts as `number`). Ungrouped expenses are entries where `groupId IS NULL`.

---

## Component Architecture

### New component: `AdditionalEntryGroupRow`

**Path:** `src/components/monthly/additional-entry-group-row.tsx`

Self-contained, manages its own UI state:
- `collapsed` (boolean, default `true`)
- `isEditingName` (boolean) — inline rename
- `addingFormOpen` (boolean) — add-entry-to-group form
- `editingId`, `savingId`, `deletingId` — per-entry states (same pattern as `AdditionalEntriesCard`)

**Props:**
```ts
interface Props {
  monthId: number;
  group: AdditionalEntryGroup;
  allGroups: AdditionalEntryGroup[]; // for the group dropdown in entry edit forms
  onGroupUpdate: (group: AdditionalEntryGroup) => void;
  onGroupDelete: (groupId: number) => void;
  // Called when an entry's groupId changes — parent card handles moving
  // the entry between groups or to/from the ungrouped list.
  onEntryGroupChanged: (entry: AdditionalEntry, toGroupId: number | null) => void;
  readOnly?: boolean;
}
```

`onEntryGroupChanged` is needed because `AdditionalEntryGroupRow` cannot update a sibling group's state directly. The parent `AdditionalEntriesCard` listens to this and updates both `groups` and `entries` state atomically.

**Rendered structure (expanded):**
```
┌─ group-row (purple-tinted border) ──────────────────────────┐
│  ▶ [name input or label]   [count pill]  [total]  [trash]   │
├─ group-body (white inset) ──────────────────────────────────│
│    entry row                                                 │
│    entry row                                                 │
│    + Añadir al grupo                                         │
└─────────────────────────────────────────────────────────────┘
```

**Collapsed:** Only the header row is shown. Clicking anywhere on the header toggles expanded state.

**Rename:** Clicking the group name text (expanded state) switches to an inline `<Input>`. Enter or blur PATCHes the label.

### Modified: `AdditionalEntriesCard`

**New props:**
```ts
groups: AdditionalEntryGroup[];
onGroupsChange: (groups: AdditionalEntryGroup[]) => void;
```

**Changes:**
1. Renders `AdditionalEntryGroupRow` for each group above ungrouped entries.
2. Adds a secondary "Añadir grupo" button next to the existing "Añadir gasto", separated by a thin vertical divider. The group button is visually subordinate (smaller text, muted color — matches the mockup).
3. "Añadir grupo" opens a single-field inline form (group name only). Confirm POSTs to create the group, adds it to local state collapsed.
4. The existing entry edit form gets a "Grupo" select appended at the bottom (expense card only): options are "Sin grupo" + each group label. On save, if `groupId` changed: PATCH the entry, then call `onEntryGroupChanged` so the card moves the entry between lists atomically.
5. `AdditionalEntriesCard` handles `onEntryGroupChanged` by removing the entry from its current location (a specific group's `entries` or the ungrouped `entries` list) and inserting it into its new destination.

**Read-only mode:** Groups render collapsed with their total and entry count, no add/edit/delete affordances. Same pattern as existing read-only entries.

---

## UX Flows

### Create group
1. Click "Añadir grupo".
2. Inline single-field form appears (group name input + confirm/cancel).
3. Enter/confirm → POST → new group added collapsed at top of groups list.

### Add entry to a group (two paths)
- **From inside the group:** Expand group → click "Añadir al grupo" → same inline label+amount form as regular add, entry created with `groupId` set.
- **From top-level add:** Click "Añadir gasto" → ungrouped entry created → open edit form → pick group from dropdown → PATCH assigns `groupId`.

### Move entry between groups (or to ungrouped)
1. Click entry label/amount to open edit form.
2. "Grupo" dropdown at bottom: "Sin grupo" or any group name.
3. Change selection → save → PATCH entry with new `groupId` (or `null`).
4. Entry moves in local state: removed from old group/ungrouped list, added to new one.

### Rename group
1. Expand group → click group name text → turns into inline input.
2. Edit → Enter or blur → PATCH label → header updates in place.

### Delete group
1. Click trash icon on group row (collapsed or expanded).
2. `AlertDialog`: "¿Eliminar el grupo «[name]» y sus [n] gastos?"
3. Confirm → DELETE → group and all its entries removed from local state.

### Read-only
Groups render collapsed with total and count. No interactive affordances.

---

## Calculations

`additionalExpenses` on `MonthData` contains only **ungrouped** entries (`groupId IS NULL`). Grouped entries live exclusively in `additionalExpenseGroups[].entries`. Both sets must be summed for `totalExpenses`.

**`src/lib/additional-entries.ts`** — update `sumAdditionalEntries` callers (or add a helper) to also sum `additionalExpenseGroups.flatMap(g => g.entries)`.

**`src/lib/calculations.ts`** — wherever `additionalExpenses` is summed into `totalExpenses`, also add the sum of all group entries from `additionalExpenseGroups`.

**`AdditionalEntriesCard` header total** — the displayed total must sum ungrouped `entries` + all `groups.flatMap(g => g.entries)`.

The year summary averages (`avgAdditionalEntriesPerMonth`) are similarly affected and must be updated to include grouped entries.

---

## Drizzle Schema Migration

```ts
// New table
export const additionalEntryGroups = pgTable("additional_entry_groups", {
  id: serial("id").primaryKey(),
  monthId: integer("month_id")
    .notNull()
    .references(() => months.id, { onDelete: "cascade" }),
  label: text("label").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// additionalEntries gains:
groupId: integer("group_id")
  .references(() => additionalEntryGroups.id, { onDelete: "cascade" }),
```

Run `npx drizzle-kit push` to apply.

---

## Out of Scope

- Groups for additional income entries.
- Reusable group templates across months.
- Drag-and-drop to assign entries to groups.
- Persisting collapsed/expanded state across reloads.
- Moving a group between months.
