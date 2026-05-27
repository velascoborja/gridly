# Tag Settings Save Button Alignment Design

## Context

The mobile tag edit row now stacks the name input, color palette, and action row. The Save button currently grows across the available mobile width, which makes the action row feel too heavy.

## Approved Direction

Keep the mobile stacked row, but change the action row so both buttons align to the right on mobile. The Save button should use the same compact fixed width as desktop (`min-w-20`) instead of `flex-1`.

## Interaction Behavior

No interaction behavior changes:

- Save remains disabled until a changed non-empty draft exists.
- Save keeps its pending spinner and `aria-busy` state.
- Delete remains a compact icon button and keeps the existing confirmation dialog.
- Existing save/delete errors and `router.refresh()` calls remain unchanged.

## Implementation Scope

Update `src/components/settings/tag-manager-card.tsx`, `src/components/settings/tag-manager-card.test.ts`, and `docs/features/tags.md`.

No API, database, routing, or translation changes are required.

## Validation

Update the characterization test so it fails while Save is still `flex-1`, then passes after the action row uses right alignment and a fixed-width Save button. Run the targeted tag manager test, the project test suite, and lint for the touched component.
