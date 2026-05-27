# Tag Settings Mobile Color Swatch Design

## Context

The Settings tag manager currently shows all tag colors for every row. This works on wider screens, but it still creates visual clutter on mobile because each tag card shows nine color dots even when the user is only reviewing or editing the tag name.

## Approved Direction

On mobile, each tag row should show the tag name input and the currently selected color as a tappable swatch on the right side of that same row. The full color palette should be hidden by default on mobile and revealed only when the user taps the selected color swatch for that row.

Desktop and tablet layouts keep the existing always-visible palette row so wider screens remain efficient for bulk edits.

## Interaction Behavior

- Tapping the selected-color swatch toggles the mobile color palette for that row.
- Choosing a color updates the draft color immediately and closes the mobile palette for that row.
- Only one row's mobile palette needs to be open at a time.
- Save, delete, pending, disabled, error, and `router.refresh()` behavior remain unchanged.
- The selected-color swatch must be disabled while the row is saving or deleting.

## Visual Constraints

- Mobile should prioritize a compact first impression: name input plus one visible color swatch.
- The selected swatch should be large enough to tap comfortably and should keep the existing selected-color ring treatment.
- The expanded mobile palette should use the existing tag color buttons and remain within the row card.
- At `sm` and above, the current compact desktop grid remains visible and unchanged.

## Implementation Scope

Expected code changes are limited to:

- `src/components/settings/tag-manager-card.tsx`
- `src/components/settings/tag-manager-card.test.ts`
- `docs/features/tags.md`

No API, database, routing, or i18n changes are required.

## Validation

Update characterization tests so the mobile selected-color trigger, hidden-by-default mobile palette, open-row state, and preserved desktop palette are represented in source. Then run the targeted tag manager test, the project test suite, and lint for the touched component.
