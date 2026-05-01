# Drag and Drop Additional Entries Between Months

## Goal

Users can move a dynamic additional income or expense from one month to another from the monthly view. The primary interaction is dragging an entry row onto a target month in the existing month strip. The move changes the entry's owning month; it does not copy or duplicate the entry.

## Scope

In scope:

- Additional income and additional expense entries managed by `AdditionalEntriesCard`.
- Moving entries between months within the same year.
- Updating persisted data through the existing entry detail route.
- Recomputing the local `YearData` month chain after a move, without forcing an App Router refresh.
- A keyboard and touch friendly move fallback using a compact month picker.
- Spanish and English translations for new visible UI strings.
- Feature documentation updates for additional entries and monthly management.

Out of scope:

- Moving fixed scalar values such as payslip, home expense, personal expense, investment, or interests.
- Moving recurring expenses.
- Copying entries.
- Cross-year moves.
- Reordering entries within a month.

## Interaction Design

Editable additional entry rows become draggable when the monthly view is not read-only and the row is not currently being edited, saved, or deleted. Dragging starts from the row itself, not from the delete button or edit form.

While an entry is being dragged, the month strip exposes eligible month tabs as drop targets. The source month and disabled/read-only states are not valid targets. Target tabs use a subtle dashed purple border and light purple background on drag hover, matching Gridly's existing Stripe-inspired design tokens.

Dropping the row on a different month moves the entry. The UI shows an in-progress state for that entry while the request is pending. On success, the entry disappears from the source month, appears in the target month under the same type, and all affected totals, savings, and downstream balances are recomputed locally.

The fallback move action opens a compact month picker for the same destination set. It exists so touch and keyboard users can complete the same action without browser drag-and-drop.

## API Design

Extend `PATCH /api/months/[monthId]/entries/[entryId]` to accept an optional `monthId` in the JSON body.

Validation rules:

- User must be authenticated.
- Route `monthId` must identify the source month and must be owned by the user.
- `entryId` must identify an owned entry currently attached to the source month.
- Body `monthId`, when present, must identify a target month owned by the same user.
- Target month must belong to the same year as the source month.
- If target equals source, return the unchanged entry.

Persistence:

- Existing label and amount updates continue to work.
- When body `monthId` is valid, update `additional_entries.month_id`.
- Return the updated entry with numeric database fields still serialized as the current route does.
- Continue calling downstream year carry-over propagation after successful mutation.

## Client Architecture

`MonthOverview` remains the state owner for all 12 months. It will track the currently dragged entry metadata:

- entry id
- source month id and month number
- type (`income` or `expense`)

`AdditionalEntriesCard` receives optional callbacks for drag start, drag end, and fallback move requests. It remains responsible for rendering entry rows and local add/edit/delete interactions, but it does not mutate other months directly.

`MonthOverview` handles the move request because it has access to every month in `YearData`. After the API succeeds, it maps over all months:

- removes the moved entry from the source month's matching additional entry collection
- inserts the returned entry into the target month's matching collection
- sorts both affected lists with `sortAdditionalEntriesDesc`
- recomputes the full chain with `computeMonthChain`
- calls `onYearDataChange` with the updated year snapshot

The month strip gets drag-over, drag-leave, and drop handlers. These handlers are only active while a draggable additional entry is in progress.

## Error Handling

If the API request fails, the client leaves local month data unchanged and clears drag/move pending UI state. A failed drag does not navigate between months.

The fallback picker should keep the move action disabled while the request is pending. Drag drop targets should ignore additional drops while the same entry is already moving.

## Accessibility

Drag-and-drop is an enhancement, not the only path. The fallback move action exposes month choices as buttons with accessible labels. Entry rows keep the existing edit-on-click behavior. Delete remains an explicit icon button and should not initiate dragging.

## Internationalization

Add new strings under the monthly additional entries namespace in both `messages/es.json` and `messages/en.json`. Spanish copy is the primary source. New strings cover:

- move action label
- move dialog/picker title
- destination month aria label
- moving state
- drop target aria label

## Tests

Add source-level tests consistent with the existing suite:

- The entry detail route accepts `monthId` updates and validates target ownership/year compatibility.
- `MonthOverview` wires a move handler that patches the entry route, updates both source and target month collections, recomputes the month chain, and calls `onYearDataChange`.
- `AdditionalEntriesCard` exposes draggable rows only for editable entry rows and renders the fallback move action.

Run at minimum:

- `npm test`
- `npm run lint`

## Documentation

Update `docs/features/additional-entries.md` to document moving entries between months, the PATCH endpoint behavior, and the move-only semantics.

Update `docs/features/monthly-management.md` to mention that additional entry moves recompute local year data without route refresh, matching the existing monthly mutation behavior.
