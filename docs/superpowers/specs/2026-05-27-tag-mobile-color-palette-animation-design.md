# Tag Mobile Color Palette Animation Design

## Context

The mobile Settings tag manager now hides each row's color palette behind the selected-color swatch. Tapping the swatch currently reveals or hides the palette instantly, which feels abrupt compared with the surrounding premium card interactions.

## Approved Direction

Add a subtle mobile-only show/hide animation to the color palette:

- fade opacity in and out;
- slide slightly on the Y axis;
- expand and collapse height with `max-height`;
- keep the motion short, around 150-200ms.

Desktop and tablet keep the full palette always visible and should not gain a distracting animation.

## Interaction Behavior

- Tapping the selected-color swatch still toggles the palette for that row.
- Choosing a color still updates the draft immediately and closes the palette.
- Save, delete, disabled, pending, error, and refresh behavior remain unchanged.
- The palette remains mounted so CSS can animate between open and closed states.

## Implementation Scope

Expected code changes are limited to:

- `src/components/settings/tag-manager-card.tsx`
- `src/components/settings/tag-manager-card.test.ts`
- `docs/features/tags.md`

No API, database, routing, or translation changes are required.

## Validation

Update the tag manager characterization test to require mounted animated palette classes instead of `hidden`, then run the targeted tag manager test, the project test suite, and lint for the touched component.
