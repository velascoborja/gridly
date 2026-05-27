# Feature: Tags

Users can assign a single tag to any ungrouped additional expense entry. Tags have a name and a color from a fixed 9-color palette, and are global to the user's account — created once, reusable across all years and months.

## Scope

- Tags apply to **expense entries** (not income). Tags on ungrouped entries are assigned per-entry via the inline `TagPicker` on each row. Tags on grouped entries are assigned at the group level — a tag assigned to a group propagates to all its entries automatically, and individual entries inside a group do not have their own tag picker.
- No dedicated tag management page — tags are created inline when assigning.
- One tag per entry or group; a tag can be cleared at any time.

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

### Entry and Group endpoints

Both `POST /api/months/[monthId]/entries` (create) and `PATCH /api/months/[monthId]/entries/[entryId]` (edit) accept an optional `tagId?: number | null`. Sending `tagId: null` explicitly clears the tag. Moving an entry into a group replaces its tag with the destination group's tag (which may be `null`), alongside clearing `isRecurring`.

`PATCH /api/months/[monthId]/entry-groups/[groupId]` (edit group) accepts an optional `tagId?: number | null`. Assigning a tag to a group automatically updates all entries within that group to the same tag.

## Server-Side Data Loading

`src/lib/server/year-data.ts` resolves tags when loading year data: after fetching all entries and groups, it collects the unique non-null `tagId` values, runs a single `inArray` query against the `tags` table, and builds a `Map<number, Tag>`. Each entry and group's `tag` field is populated from this map (or `null`). No additional client-side fetches are needed for display.

## Component Architecture

### `src/lib/tags.ts`

Exports `TAG_COLORS`, `TAG_COLOR_KEYS`, and the `TagColor` interface. The single source of truth for palette data.

### `src/components/monthly/tag-picker.tsx`

Controlled popover (`@base-ui/react/popover`) with two internal views:

- **List view** — existing tags with checkmarks, a "Sin etiqueta" clear option, and a "+ Nueva etiqueta" link.
- **Create view** — name text input, 9-color swatch grid, and "Crear y asignar" button. "← Volver" returns to the list without creating. On successful creation the new tag is immediately selected and the popover closes.

The trigger button highlights with `bg-primary/10` when a tag is currently assigned. The component also accepts an optional `customTrigger?: React.ReactElement` prop to completely override the default tag icon button.

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

## Error Handling

- `POST /api/tags` returns 400 if `name` is empty or `color` is not a valid palette key.
- If the tags fetch fails on mount, the tag action button is hidden for that session (no hard error shown).
- Tag assignment is always optional — saving an entry without a tag is valid.
