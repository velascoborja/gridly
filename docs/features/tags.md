# Feature: Tags

Users can assign a single tag to any ungrouped additional expense entry. Tags have a name and a color from a fixed 9-color palette, and are global to the user's account — created once, reusable across all years and months.

## Scope

- Tags apply to **expense entries** (not income). Tags on ungrouped entries are assigned per-entry via the inline `TagPicker` on each row. Tags on grouped entries are assigned at the group level — a tag assigned to a group propagates to all its entries automatically, and individual entries inside a group do not have their own tag picker.
- Tags also apply to **recurring expenses** (the fixed monthly expenses shown in the Fixed Expenses card). A tag can be assigned, changed, or cleared on any recurring expense row directly from the monthly fixed-expenses card. Because recurring expenses are part of a year-wide series, every tag change triggers a confirmation dialog; on confirmation, the change is propagated to the template row and all monthly copies for that year.
- Tags are created inline when assigning and managed globally from the main Settings page.
- One tag per entry, group, or recurring expense; a tag can be cleared at any time.

## Data Model

### `tags` table (`src/db/schema.ts`)

| Column | Type | Notes |
|---|---|---|
| `id` | serial PK | |
| `userId` | text FK → `users.id` | `onDelete: cascade` |
| `name` | text NOT NULL | User-defined label |
| `color` | text NOT NULL | Key from the 9-color palette |
| `createdAt` | timestamp | `defaultNow()` |

### `additionalEntries.tagId` and `additionalEntryGroups.tagId`

Nullable integer FK → `tags.id` with `onDelete: set null`. If a tag is ever deleted, affected entries and groups silently lose their tag — entries and groups are never cascade-deleted.

### `yearRecurringExpenses.tagId` and `monthlyRecurringExpenses.tagId`

| Column | Notes |
|---|---|
| `yearRecurringExpenses.tagId` | Nullable integer FK → `tags.id`, `onDelete: set null`. The authoritative tag for the series template. |
| `monthlyRecurringExpenses.tagId` | Nullable integer FK → `tags.id`, `onDelete: set null`. Per-month copy; kept in sync with the template when a tag change is propagated across the series. |

## Color Palette

Nine fixed colors, defined in `src/lib/tags.ts` as `TAG_COLORS` (a record mapping key → `{ bg, border, text }`) and `TAG_COLOR_KEYS` (ordered array). Colors are stored as string keys in the DB and resolved to hex values at render time.

| Key | Hex |
|---|---|
| `rose` | #f43f5e |
| `orange` | #f97316 |
| `amber` | #eab308 |
| `emerald` | #10b981 |
| `cyan` | #06b6d4 |
| `blue` | #3b82f6 |
| `violet` | #8b5cf6 |
| `pink` | #ec4899 |
| `slate` | #64748b |

The `bg` and `border` values use `rgba` with low opacity so chips look good on any background surface.

## API

### `GET /api/tags`

Returns all tags for the authenticated user as `Tag[]`.

### `POST /api/tags`

Body: `{ name: string; color: string }`. Validates that `name` is non-empty and `color` is a valid palette key (400 otherwise). Returns the created `Tag` with status 201.

### `PATCH /api/tags/[tagId]`

Body: `{ name: string; color: string }`. Validates that the requester owns the tag, `name` is non-empty, and `color` is a valid palette key. Returns the updated `Tag`.

### `DELETE /api/tags/[tagId]`

Deletes a tag owned by the authenticated user. Existing entries and groups that used the tag become untagged via the database `onDelete: set null` foreign keys; no financial entries or groups are deleted.

### Entry and Group endpoints

Both `POST /api/months/[monthId]/entries` (create) and `PATCH /api/months/[monthId]/entries/[entryId]` (edit) accept an optional `tagId?: number | null`. Sending `tagId: null` explicitly clears the tag. Moving an entry into a group replaces its tag with the destination group's tag (which may be `null`), alongside clearing `isRecurring`.

`PATCH /api/months/[monthId]/entry-groups/[groupId]` (edit group) accepts an optional `tagId?: number | null`. Assigning a tag to a group automatically updates all entries within that group to the same tag.

### Recurring expense endpoint

`PATCH /api/months/[monthId]/recurring-expenses/[entryId]` also accepts an optional `tagId?: number | null`. When present:

- If the recurring expense has a `yearRecurringExpenseId` (i.e. it belongs to a year-wide series), the tag is written to the template row (`year_recurring_expenses`) **and** to all monthly copies of that series (`monthly_recurring_expenses`) across the year.
- If the recurring expense is an orphaned copy with no `yearRecurringExpenseId`, only that single row is updated.

The UI always shows a confirmation dialog before applying a tag change on a recurring expense, informing the user that the change will affect the entire year's series.

## Server-Side Data Loading

`src/lib/server/year-data.ts` resolves tags when loading year data: after fetching all entries, groups, and recurring expenses, it collects the unique non-null `tagId` values from all three sources into a single `usedTagIds` set, runs a single `inArray` query against the `tags` table, and builds a `Map<number, Tag>`. Each entry, group, and recurring expense's `tag` field is populated from this map via `resolveTag` (or `null`). No additional client-side fetches are needed for display.

## Component Architecture

### `src/lib/tags.ts`

Exports `TAG_COLORS`, `TAG_COLOR_KEYS`, and the `TagColor` interface. The single source of truth for palette data.

### `src/components/monthly/tag-picker.tsx`

Controlled popover (`@base-ui/react/popover`) with two internal views:

- **List view** — existing tags with checkmarks, a "Sin etiqueta" clear option, and a "+ Nueva etiqueta" link.
- **Create view** — name text input, 9-color swatch grid, and "Crear y asignar" button. "← Volver" returns to the list without creating. On successful creation the new tag is immediately selected and the popover closes.

The trigger button highlights with `bg-primary/10` when a tag is currently assigned. The component also accepts an optional `customTrigger?: React.ReactElement` prop to completely override the default tag icon button.

### `src/components/settings/tag-manager-card.tsx`

Settings card for global tag maintenance:

- Fetches all tags from `GET /api/tags`.
- Keeps editable drafts per row until Save succeeds.
- Saves name/color changes through `PATCH /api/tags/[tagId]`, then updates the local tag row and draft state from the response without refreshing the current route.
- Deletes tags through `DELETE /api/tags/[tagId]` after a confirmation that explains existing expenses and groups become untagged.
- Shows localized loading, empty, and error states without blocking the rest of Settings.
- Uses a mobile-specific compact edit layout: the name input, currently selected color button, icon-only Save button, and compact Delete button sit together in a single horizontal row. Tapping the color button reveals the full palette below that row. At `sm` and above, rows keep the compact desktop single-line grid with the full palette always visible and the Save button showing text.

### `src/components/monthly/entry-form-row.tsx`

Has an optional `tagAction?: React.ReactNode` slot alongside the existing `recurringAction`. The grid column formula handles 0/1/2/3 extra action columns.

### `src/components/monthly/additional-entries-card.tsx`

- Fetches tags on mount via `GET /api/tags` (skipped in read-only mode and for income entries).
- Passes a `TagPicker` as `tagAction` to `EntryFormRow` for both the add form and each open edit form (ungrouped expenses only).
- `handleCreateTag`: calls `POST /api/tags`, appends the new tag to local `tags` state, and returns the `Tag` to `TagPicker`.
- Includes `tagId` in create and edit payloads; resolves `tag` from local state on the returned entry to avoid a refetch.
- Renders a tag chip inline in the entry list row, alongside the "anual" recurring badge.
- **Responsive Optimization**: To prevent aggressive text truncation on narrow mobile screens, if an entry has *both* a tag and is recurring, the "anual" text badge gracefully collapses into a simple primary-colored dot on `< sm` viewports.

### `src/components/monthly/additional-entry-group-row.tsx`

The group header utilizes `TagPicker` to assign a tag to the group itself.
- When a tag is assigned, it uses the `customTrigger` prop of `TagPicker` to render the colored tag chip as the interactive trigger.
- This hides the default tag icon button, allowing the user to tap the assigned tag itself to open the menu and change/remove it.
- Individual grouped entries do not receive a `tagAction`, mirroring the existing behaviour for `recurringAction`.

## i18n Keys

All keys live under `Monthly.additionalEntries` in `messages/es.json` and `messages/en.json`:

| Key | ES | EN |
|---|---|---|
| `tagButton` | Asignar etiqueta | Assign tag |
| `yourTags` | Tus etiquetas | Your tags |
| `noTag` | Sin etiqueta | No tag |
| `newTag` | + Nueva etiqueta | + New tag |
| `tagName` | Nombre... | Name... |
| `createAndAssign` | Crear y asignar | Create & assign |

All Settings tag-management keys live under `Settings.tags` in `messages/es.json` and `messages/en.json`:

| Key | Purpose |
|---|---|
| `title` | Card title |
| `description` | Card description |
| `count` | Tag count badge |
| `loading` | Loading state |
| `empty` | Empty state |
| `nameLabel` | Name input label |
| `colorLabel` | Color swatch group label |
| `save` / `saving` | Save action states |
| `delete` / `deleting` | Delete action states |
| `cancel` | Delete dialog cancel action |
| `deleteTag` | Delete button accessible label |
| `selectColor` | Color button accessible label |
| `deleteConfirmTitle` | Delete dialog title |
| `deleteConfirmDescription` | Delete dialog impact text |
| `loadError` / `saveError` / `deleteError` | Error states |

## Error Handling

- `POST /api/tags` returns 400 if `name` is empty or `color` is not a valid palette key.
- If the tags fetch fails on mount, the tag action button is hidden for that session (no hard error shown).
- Tag assignment is always optional — saving an entry without a tag is valid.
- Settings tag management shows explicit localized errors for failed loading, saving, and deletion. Save is disabled for unchanged rows and blank names; API validation remains authoritative.

## Categorías View

A dedicated "Categorías" tab in the in-year navigation aggregates additional expense spending by tag for the selected year. Accessible at `/{locale}/{year}/categories`.

### Placement

The tab appears in the same pill row as "Meses", "Año", and "Evolución". It is disabled for historical years (same as Meses and Año). Switching the year selector while on the Categorías tab navigates to the same tab for the new year.

### Computation

`computeTagStats(yearData: YearData): TagStats` in `src/lib/tag-stats.ts` derives all stats from the already-loaded `YearData` — no additional API calls.

- **Ungrouped additional expenses:** each entry's `tagId` (or `null` for untagged) determines its bucket.
- **Grouped additional expenses:** all entries inside a group are attributed to the group's `tagId`. Each entry appears in the drilldown with `groupName` set to the group's label. Group entries are **not** double-counted against their parent group total.
- **Recurring expenses:** bucketed exactly like additional expenses — tagged recurring expenses go to their tag bucket, untagged ones go to the untagged bucket. All recurring expenses count toward the `totalAdditional` denominator used for `shareOfTotal`.
- Results are sorted by `totalAmount` descending. The untagged bucket (if any) is always last.
- `shareOfTotal` = `bucket.totalAmount / totalAdditional` where `totalAdditional` includes both tagged and untagged entries (additional and recurring).
- Progress bar width is relative to the top tag's amount (so the widest bar is always 100%).

### Components

| Component | File | Role |
|---|---|---|
| `CategoriesView` | `src/components/annual/categories-view.tsx` | Tab content — header strip + ranked tag rows |
| `TagStatRow` | `src/components/annual/tag-stat-row.tsx` | Collapsible row with progress bar; expands to show entries |
| `DrilldownList` | `src/components/annual/drilldown-list.tsx` | Chronological list of individual entries for an expanded tag |

### i18n

All keys live under `Annual.categories` in `messages/es.json` and `messages/en.json`. The nav tab label is `Nav.categories`.

## Evolution Tags Dialog

The Evolution dashboard has a Tags icon button when there is multi-year tag data to show. It opens a dialog that aggregates spending by tag across all full Gridly years and reuses `TagStatRow` for the ranked list and expandable entry drilldown. Historical summary-only imports are excluded because they do not include expense or tag rows.

`computeMultiYearTagStats(yearDataList: YearData[]): TagStats` in `src/lib/tag-stats.ts` applies the same bucketing rules as `computeTagStats`, but adds `year` to each `DrilldownEntry`. `DrilldownList` detects that field and groups expanded entries by year, sorted ascending, instead of by month. Year headers are collapsed by default, show that year's aggregate amount, and expand inline when tapped. Within a year group, entries remain sorted by month.

The dialog strings live under `Evolution.categoriesButton` and `Evolution.categoriesTitle` in `messages/es.json` and `messages/en.json`.
