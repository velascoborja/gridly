# Tag Settings Management Design

## Goal

Add a global tag-management section to the main Settings page so users can edit the name and color of existing tags and delete tags they no longer want.

## Placement and UI

The main Settings page gains a new `Etiquetas` / `Tags` card between the Language card and Keyboard Shortcuts card.

The card lists existing tags as editable rows:

- Name input for the tag label.
- Fixed palette color swatches using the existing tag color keys from `src/lib/tags.ts`.
- Row-level Save action.
- Row-level Delete action.

The card follows Gridly's existing Settings card style: white/background surface, subtle border, compact radius, low elevation, and primary-purple accents for the tag-management affordance. Empty state copy explains that tags can be created from monthly expense rows.

## Data Flow and API

The Settings page fetches tags with the existing `GET /api/tags` endpoint.

Add a tag detail route at `src/app/api/tags/[tagId]/route.ts`:

- `PATCH /api/tags/[tagId]`
  - Requires an authenticated user.
  - Validates that the tag belongs to the current user.
  - Accepts `{ name: string; color: string }`.
  - Rejects blank names and colors outside `TAG_COLOR_KEYS`.
  - Returns the updated `{ id, name, color }` tag.
- `DELETE /api/tags/[tagId]`
  - Requires an authenticated user.
  - Validates that the tag belongs to the current user.
  - Deletes only that tag.
  - Returns a success response.

Existing schema behavior remains unchanged: `additionalEntries.tagId` and `additionalEntryGroups.tagId` already use `onDelete: set null`, so deleting a tag removes tag assignment from expenses and groups without deleting financial data.

## Client Behavior

Create a focused `TagManagerCard` component and render it from `SettingsForm`.

The component owns tag-management UI state:

- Fetch tags on mount.
- Keep row drafts separate from persisted values.
- Enable Save only when the row draft differs from the persisted tag and the name is non-empty.
- Disable only the affected row during save/delete.
- Update local state immediately after successful saves and deletes.
- Keep drafts intact when a save fails.

Deletion uses a confirmation dialog that clearly states existing expenses and groups using the tag will become untagged.

## Error Handling

Errors are explicit and localized:

- Failed initial fetch shows a card-level error and keeps the rest of Settings usable.
- Failed save shows a row-level or card-level error while preserving the user's draft.
- Failed delete keeps the tag visible and shows an error.
- Invalid user input disables Save before request submission where possible; API validation remains authoritative.

No silent fallbacks are introduced.

## Internationalization

Add Spanish and English strings under `Settings.tags` in `messages/es.json` and `messages/en.json`.

Spanish remains the primary copy source. Required copy includes card title, description, empty state, field labels, save/delete actions, confirmation dialog text, loading states, and error messages.

## Documentation

Update `docs/features/tags.md` to remove the old "No dedicated tag management page" scope statement and document the Settings tag manager, update/delete endpoints, deletion behavior, and i18n keys.

## Validation

Add or update tests covering:

- Tag update rejects unauthenticated access, invalid colors, and blank names.
- Tag update/delete are scoped to the current user.
- Tag deletion relies on existing `onDelete: set null` relationships and does not delete financial entries or groups.
- Settings source-level coverage includes the tag manager card and deletion confirmation flow.

Run the existing project test suite after implementation.
