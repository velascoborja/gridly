# Demo Data Tour Design

## Goal

Allow unauthenticated visitors to enter a read-only demo version of Gridly from the landing page and quickly understand the product using fake sample data.

## Constraints

- Keep code changes minimal.
- Do not modify the authenticated data model or onboarding flow.
- Do not create demo rows in the database.
- Do not require login before viewing the demo.
- Keep UI strings in Spanish.

## Recommended Approach

Add a public demo route namespace under the localized app and render existing app views with a hardcoded sample `YearData` object.

This keeps the demo fully separate from real user data and avoids touching:

- auth/session rules
- database schema or seed data
- year creation and prefill APIs
- onboarding/setup flow

## Scope

### Landing page

Add a secondary CTA on the public landing page that links directly to the demo experience.

Example target:

- `/es/demo/2026/4`

### Demo data

Create a small helper that returns a complete sample `YearData` object with:

- realistic yearly config values
- all 12 months populated
- chained balances that look believable
- June and December extra pays
- a few additional income and expense entries to make the UI feel real

The helper should be static and local to the codebase.

Suggested location:

- `src/lib/demo/demo-year.ts`

### Demo pages

Add public demo pages that reuse the current UI:

- monthly view entry: `src/app/[locale]/demo/[year]/[month]/page.tsx`
- annual summary entry if needed: `src/app/[locale]/demo/[year]/summary/page.tsx`

The monthly route is the primary requirement because it gives users the quickest product tour with the least code.

The summary route is optional unless the existing shell/navigation strongly expects it.

## Component Strategy

Prefer reuse over new UI.

Use the existing app components where they already accept data as props, especially:

- `AppShell`
- `MonthOverview`
- `AnnualView` if summary is included

Only introduce a small `demoMode` prop where required to suppress behaviors that assume a logged-in user or writable data.

Examples of behavior to disable in demo mode:

- inline editing
- save/update requests
- export actions if they depend on auth
- setup redirects

## Navigation Behavior

The demo should feel like the real app, but remain read-only.

- users can navigate across demo months
- users can view the demo summary if implemented
- users should see clear sign-in affordances to use the real product

If the existing shell makes authenticated assumptions that are expensive to unwind, use the smallest targeted conditional logic needed for demo mode rather than refactoring shared navigation.

## Error Handling

- invalid demo month params should return `notFound()`
- invalid demo year params should either return `notFound()` or redirect to the single supported demo year
- demo pages must never query the database or session as part of normal rendering

## Testing Strategy

Keep testing minimal and focused on the new behavior.

Recommended coverage:

- route rendering for the public demo month page
- demo helper returns a valid `YearData` shape with 12 months
- landing page contains the demo CTA link

If the repo has limited route/component test coverage today, the smallest acceptable test set is one focused test for the demo data helper and one render/assertion for the landing CTA.

## Trade-offs

### Benefits

- smallest safe change
- no data cleanup concerns
- no guest account complexity
- very low risk of affecting authenticated users

### Costs

- demo is separate from the exact production data flow
- some shared components may need tiny conditionals for read-only mode
- if too many authenticated assumptions are embedded in `AppShell`, partial UI reuse may be needed instead of full shell reuse

## Out of Scope

- anonymous database-backed guest users
- persisting demo edits
- converting demo data into a real account after sign-in
- replacing the current authenticated setup flow

## Implementation Notes

The first implementation attempt should aim for:

1. one new demo data helper
2. one new public demo month page
3. one landing-page CTA
4. only the minimum shared-component changes required to make the page render read-only

If that works cleanly, the summary route can be added as a follow-up in the same task only if it remains low-cost.
