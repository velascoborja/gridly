# Sequential Next-Year Carry-Over Design

## Summary

Gridly should let users create only the immediate next year after their latest existing year. New years must start from the projected closing balance of the previous year, and any change in an earlier year must continue propagating forward through all later consecutive years.

This replaces the current open-ended year creation flow with a sequential planning model that matches the app's balance-chain behavior.

## Goals

- Restrict year creation to the next consecutive year only.
- Seed each new year from the projected December ending balance of the previous year.
- Keep future years continuously updated when prior years change.
- Preserve the current yearly prefill flow and monthly chain rules.

## Non-Goals

- Supporting gaps in the year chain.
- Allowing users to create arbitrary future years out of order.
- Designing a manual detach or override mode in this iteration.
- Changing monthly income and expense estimation rules.

## Product Rules

### Sequential Creation

- If a user has no years yet, the app may still initialize the first year normally.
- If the latest existing year is `Y`, the only year the user can create is `Y + 1`.
- The UI must not expose controls for creating `Y + 2` or any later year directly.
- Server-side validation must reject non-sequential creation attempts even if the request is sent manually.

### Carry-Over Source

- The starting balance for year `Y + 1` is derived from the projected `endingBalance` of December in year `Y`.
- The projected December ending balance is the final result of the existing monthly chain calculation for year `Y`.
- This derived balance is the source of truth for consecutive future years.

### Continuous Propagation

- If year `Y` changes in any way that affects its projected December ending balance, year `Y + 1` must be updated automatically.
- The recalculation must continue forward through every later consecutive year.
- Example: if `2026` changes, recompute `2027`; if that changes `2027` December, recompute `2028`; continue until the latest year.

### Year Config Ownership

- The first year in a user's dataset keeps its own stored `startingBalance`.
- Later years should be treated as carry-over years whose effective `startingBalance` comes from the previous year.
- Other year config fields such as `estimatedSalary`, `monthlyInvestment`, `monthlyHomeExpense`, `monthlyPersonalBudget`, and `interestRate` remain owned by that year.

## UX Changes

### Navigation / Entry Point

- Replace generic year creation affordances with a single action for the next available year.
- The label should be explicit, for example `Crear 2027`.
- Helper text should explain that the new year starts from the projected closing balance of the previous year.

### Setup Experience

- When creating the next year, prefill the starting balance automatically from the previous year's projected December ending balance.
- The setup screen should communicate that this value is automatic and linked to the previous year.
- The user should not choose an arbitrary year from the setup flow if at least one year already exists.

### Visibility of Derived Balance

- In year-level configuration, the starting balance for consecutive years should be presented as derived from the previous year.
- Messaging should make it clear why future years move when earlier years change.

## Data and Calculation Model

### Effective Starting Balance

- For the first year, effective starting balance = stored `startingBalance`.
- For every later consecutive year, effective starting balance = previous year's projected December `endingBalance`.

### Month Rebuild Behavior

- Whenever a year's effective starting balance changes, its month chain must be recomputed using the existing `computeMonthChain` rules.
- Existing month input values for payslip, expenses, bonus, interests, personal remaining, and additional entries are preserved.
- Only the derived balance fields and downstream totals should change as a result of propagation.

### Prefill Behavior for New Years

- Creating a new consecutive year should still run the current prefill mechanism for all 12 months.
- Prefill must use the carry-over-derived starting balance and that new year's own config values.
- Additional pays remain automatic in June and December according to the existing rules.

## API / Validation Expectations

### Create Year

- `POST /api/years` must enforce sequential creation.
- If the request year is not the first year or the immediate successor of the latest existing year, return a validation error.
- For consecutive creation, ignore or override any client-provided starting balance and derive it from the previous year.

### Recalculation Triggers

- Any mutation that can change a year's projected December ending balance must trigger forward propagation.
- This includes year config updates and month-level or additional-entry updates that affect balances.

### Read Model

- Responses that expose year data must return the effective starting balance that the UI should display.
- The read model should remain internally consistent with the propagated month chain.

## Error Handling

- If a user attempts to create a non-sequential year, return a clear error message indicating that only the next year can be created.
- If the previous year needed for carry-over is missing, treat creation as invalid rather than guessing a balance.
- Propagation must be transactional enough to avoid partially updated consecutive years being returned as stable data.

## Testing Requirements

- Verify first-year creation still works.
- Verify a user with latest year `Y` can create `Y + 1`.
- Verify creation of `Y + 2` is rejected when `Y + 1` does not exist.
- Verify the created next year uses the previous year's projected December ending balance.
- Verify updating an earlier year propagates starting balance changes into all later consecutive years.
- Verify monthly field edits and additional-entry edits both trigger forward propagation.
- Verify UI only offers the immediate next year creation action.

## Open Implementation Decisions

- Whether carry-over years store a cached `startingBalance` in the database that is updated during propagation, or compute it dynamically on read and persist only dependent month changes.
- The exact UX surface where the `Crear {nextYear}` action should live.

## Recommendation

Implement this as a sequential chain with server-enforced validation and forward propagation on every balance-affecting write. That keeps the model understandable: one contiguous forecast timeline where each year starts from the projected result of the previous one.
