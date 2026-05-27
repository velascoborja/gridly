# Tag Settings Mobile Edit Layout Design

## Context

The Settings tag manager currently uses a compact single-row edit layout on larger screens. On mobile, that same row stacks into a tall card where the name input, color palette, and action buttons feel visually crowded. The goal is to refine the mobile composition without changing tag management behavior or the desktop/tablet layout.

## Approved Direction

Use a mobile-only version of option A: stacked but tightened.

Each tag edit card on narrow screens will use:

1. A full-width name input at the top.
2. A centered, single-line color palette below the input.
3. A final action row with a full-width labeled Save button and a compact square delete button.

At the `sm` breakpoint and above, the existing desktop grid remains unchanged: name input, palette, and actions stay in a single line.

## Interaction Behavior

Save and delete behavior remains unchanged:

- Save is disabled until the draft has a non-empty changed value.
- Save shows the existing pending state while the PATCH request is in flight.
- Delete opens the existing confirmation dialog.
- Confirmed deletion shows the existing pending state while the DELETE request is in flight.
- Existing localized errors remain visible for failed load, save, or delete operations.

## Visual Constraints

The mobile layout should preserve Gridly's premium card treatment:

- Keep the current elevated row card, rounded corners, and soft border.
- Keep the current tag color palette and selected-color ring.
- Improve scanability with clearer vertical rhythm and mobile tap targets.
- Avoid introducing new strings, new icons, or new data flow.

## Implementation Scope

Expected code changes are limited to `src/components/settings/tag-manager-card.tsx`, plus the related characterization test in `src/components/settings/tag-manager-card.test.ts` and the tag feature documentation in `docs/features/tags.md`.

No API, database, routing, or i18n changes are required.

## Validation

Add or update a test that characterizes the mobile layout classes and confirms the desktop single-line grid is still present. Run the targeted tag manager test, then the project test suite.
