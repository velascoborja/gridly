# Gridly Google Authentication

Date: 2026-04-19
Status: Approved in conversation, pending final user review of written spec

## Goal

Add Google sign-in to Gridly and convert the app from a single shared dataset into a user-specific product.

The change should:

- allow any user with a Google account to sign in
- keep a public landing page at `/`
- protect all finance data routes and APIs behind authentication
- isolate each user's years, months, and entries from every other user
- assign the current legacy test data to `velascoborja@gmail.com`

The change should not:

- change the existing budgeting logic or month-chain behavior
- translate the product out of Spanish
- replace the current app structure with a third-party hosted auth product
- add a public marketing site with multiple pages or unrelated content

## Product Context

Gridly is currently a single-tenant app.

The present structure assumes one global dataset:

- `years.year` is globally unique
- server pages query year data only by numeric year
- route handlers update data without an ownership boundary
- `/` immediately redirects to the current year's overview

This is fine for local testing, but it prevents multiple users from safely using the same deployment.

## Scope

This change covers:

- Google OAuth sign-in and sign-out
- server-side session handling
- a public landing page
- protected app routes
- ownership-aware data queries and mutations
- schema changes required for users and auth persistence
- migration of existing data to `velascoborja@gmail.com`

This change does not cover:

- role-based permissions beyond standard signed-in ownership
- team/shared budgets
- password auth
- email magic links
- account settings beyond basic session controls

## Proposed Approach

Recommended approach: `Auth.js` with Google Provider and Drizzle-backed persistence in the existing Postgres database.

This is preferred because:

- it fits Next.js App Router cleanly
- it avoids hand-rolled OAuth and session code
- it keeps user/account/session state in the same database already used by Gridly
- it supports social login with less custom security surface area than a manual implementation

Rejected alternatives:

- manual Google OAuth plus custom cookies: too much security-critical logic for too little benefit
- external auth product: faster to start, but adds unnecessary product coupling for this scope

## User Experience

### Public Landing

`/` becomes a public landing page instead of an immediate redirect.

The page should follow the existing Gridly design direction from `README.md` and `DESIGN.md`:

- light premium background with atmospheric gradients
- restrained fintech typography and spacing
- strong primary CTA in violet
- product-oriented hero copy in Spanish
- one polished preview panel that hints at annual and monthly finance tracking

The public header should include:

- Gridly brand treatment on the left
- primary sign-in CTA on the right

If a signed-in user lands on `/`, the page may either show a signed-in CTA back into the app or redirect directly to the app. The recommended behavior is to redirect signed-in users to their relevant in-app destination to reduce friction.

### Authenticated App Entry

After successful Google sign-in:

- a user with existing years goes to the current year's overview if it exists, otherwise to the most recent available year
- a user with no years goes to setup for the current year

This keeps the existing "start from the current year" mental model while handling returning users with older datasets.

### Private Navigation

Once inside the authenticated app shell, the header should expose session-aware actions:

- signed-in user identity signal, at minimum avatar or email-derived label
- sign-out action

The existing navigation structure for year and month views should remain intact.

## Authentication and Session Design

### Provider

Use Google as the only sign-in provider for this phase.

Required environment variables should include:

- `AUTH_SECRET`
- `AUTH_GOOGLE_ID`
- `AUTH_GOOGLE_SECRET`

If the installed auth library version prefers different naming conventions, implementation should follow the library's current docs, but the environment contract should remain explicit in project documentation.

### Session Model

Use a database-backed session strategy through the auth library's adapter.

This keeps session handling server-friendly for App Router pages and route handlers and avoids inventing custom cookie/session infrastructure.

### Authorization Boundary

Authentication alone is not sufficient. Every finance query and mutation must be authorized against the current user.

That means:

- server page loaders must fetch years only for the signed-in user
- APIs must reject unauthenticated access
- APIs must only operate on resources owned by the signed-in user
- ownership checks must happen before returning data or applying mutations

Where practical, "missing or not yours" should resolve to the same `404` response to avoid leaking resource existence across accounts.

## Data Model

### New Tables

Add the auth-related tables needed by the chosen auth adapter:

- `users`
- `accounts`
- `sessions`
- `verificationTokens` if required by the adapter schema

The exact columns should follow the adapter's current Drizzle schema for the installed auth library version.

### Year Ownership

Add `userId` to `years` and make it required once migration is complete.

Uniqueness must change from:

- `years.year` globally unique

to:

- one `year` per `userId`

This means two different users can both have a `2026` record without conflict, while one user still cannot create duplicate records for the same year.

### Indirect Ownership

`months` and `additional_entries` can remain linked through `yearId` and `monthId`.

Ownership enforcement should work by joining through the parent chain:

- month access is valid only if its `yearId` belongs to the current user
- additional entry access is valid only if its `monthId` belongs to a month whose year belongs to the current user

This avoids unnecessarily duplicating `userId` on every child table.

## Migration Strategy

### Legacy Data Assignment

All existing finance data should be assigned to `velascoborja@gmail.com`.

The migration should guarantee that:

- a user record exists for `velascoborja@gmail.com`
- all existing rows in `years` are updated to that user's id
- ownership constraints become enforceable after backfill

### Timing

The assignment should not depend on a later manual admin step.

The implementation should make the claim deterministic as part of the schema/data migration path, not as a best-effort runtime side effect. If a runtime safeguard is also added on first sign-in, it may exist as a secondary protection, but the primary path should be migration-driven.

### New Users

Users other than `velascoborja@gmail.com` should start with no finance data.

On first login, they are authenticated successfully and then routed into setup if no year exists for them.

## Routing and Guards

### Public Routes

Publicly accessible routes for this phase:

- `/`
- auth callback and auth helper routes required by the auth library

### Protected Routes

Protected routes should include:

- `/setup/[year]`
- `/[year]/overview`
- `/[year]/summary`
- `/[year]/[month]`
- finance API routes under `/api/years/...`
- finance API routes under `/api/months/...`

### Guard Strategy

Server-rendered pages should check session state before loading user data.

Recommended behavior:

- unauthenticated request to a protected page redirects to `/`
- unauthenticated request to a protected API returns `401`
- authenticated request for someone else's data returns `404`

This keeps the UX simple for browsers and the API behavior precise for client components.

## Query and Mutation Boundaries

The main data-access change is to stop looking up records by year alone.

Examples of the new boundary:

- "get year data" must resolve by `userId + year`
- "list years" must list only years for the current user
- "update year config" must confirm the target year belongs to the current user
- "update month" must confirm the month belongs to a year owned by the current user
- "create/update/delete additional entry" must confirm the parent month belongs to the current user

The code should centralize these checks in server helpers where possible rather than re-implementing joins separately in every route handler.

## Landing Page Design

The landing page should be concise and product-specific, not generic SaaS filler.

Recommended structure:

- premium public header
- hero with Spanish product value proposition
- short supporting copy about annual overview, monthly control, and export
- primary CTA for Google sign-in
- secondary visual area showing a composed finance dashboard preview
- one short credibility/details section below the fold if needed

The page should preserve the current design language:

- use the existing brand violet as the primary action color
- keep the background mostly light with layered gradients or glows
- use measured shadows and conservative radii
- avoid marketing clichés and heavy illustration dependence

## Error Handling and Edge Cases

The implementation should define clear behavior for these cases:

- missing auth configuration: fail clearly in development and document required env vars
- denied Google consent: return the user to the landing page with a usable error state
- authenticated user with no years: redirect to setup
- authenticated user requesting a year that does not exist for them: return `404` or the route equivalent
- legacy data migration already applied: repeated deploys must remain safe and idempotent where possible

## Testing Strategy

The implementation should be validated at three levels.

### Server and Data Tests

- year lookup is scoped to the current user
- list-years only returns owned years
- month and entry mutations reject cross-user access
- migration assigns legacy data to `velascoborja@gmail.com`

### Route and Auth Tests

- unauthenticated protected-page access redirects to `/`
- unauthenticated API access returns `401`
- new authenticated user with no data is routed to setup
- authenticated legacy owner can access migrated records

### Manual Verification

- sign in with `velascoborja@gmail.com` shows existing test data
- sign in with a different Google account starts with empty state and setup
- sign out returns the app to public entry behavior
- Google sign-in button, callback, and session persistence work across reloads

## Implementation Shape

Expected implementation areas:

- `src/db/schema.ts` for auth tables and `years.userId`
- auth setup files for the chosen App Router integration
- `src/lib/server/` helpers for session-aware data access
- page components that currently fetch global data by year only
- route handlers under `src/app/api/` that currently mutate without ownership checks
- `src/app/page.tsx` and new landing components for the public homepage
- app shell/header components for authenticated session controls
- project environment examples and documentation

## Open Decisions Resolved In This Spec

The following product decisions are locked by this spec:

- any Google user may sign in
- the existing data belongs to `velascoborja@gmail.com`
- the app has a public landing page at `/`
- finance surfaces are private after sign-in
- users without existing data start from setup instead of inheriting shared data

## Success Criteria

This work is successful when:

- Google sign-in works end-to-end in the deployed app
- each authenticated user sees only their own finance data
- `velascoborja@gmail.com` retains access to the current legacy dataset
- the homepage becomes a polished public landing page in the established Gridly style
- protected pages and APIs reject unauthenticated or cross-user access
- the existing finance behavior and Spanish-language UX remain intact
