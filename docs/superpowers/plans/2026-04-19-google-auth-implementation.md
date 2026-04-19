# Gridly Google Auth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Google sign-in, make Gridly data user-specific, migrate the legacy dataset to `velascoborja@gmail.com`, and ship a public landing page with protected in-app routes.

**Architecture:** Build the feature from the inside out. First add auth and ownership support at the schema and server-helper level, then switch pages and APIs to those user-scoped helpers, and finally replace `/` with a public landing page plus signed-in navigation affordances. Keep the existing finance calculations and UI flows intact while changing the access boundary around them.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Drizzle ORM, Neon Postgres, Auth.js, Tailwind CSS v4, node:test

---

## File Map

### Dependencies and project config

- Modify: `package.json`
  - Add auth and test dependencies plus scripts needed for this feature.
- Modify: `.env.example`
  - Document Google auth environment variables.

### Database and auth schema

- Modify: `src/db/schema.ts`
  - Add Auth.js tables and `years.userId` ownership.
- Create: `src/db/auth-schema.ts`
  - Hold auth-specific table definitions if splitting keeps `schema.ts` readable.
- Create: `src/lib/server/auth-config.ts`
  - Centralize Auth.js configuration, provider setup, and callbacks.
- Create: `src/auth.ts`
  - Export app-level auth helpers from the current Auth.js integration point.

### Session and ownership helpers

- Create: `src/lib/server/session.ts`
  - Resolve the current session and require an authenticated user.
- Modify: `src/lib/server/year-data.ts`
  - Make all year queries user-scoped and add redirect-target helpers.
- Create: `src/lib/server/ownership.ts`
  - Resolve user-owned years/months/entries and normalize 401/404 behavior.
- Create: `src/lib/server/legacy-user.ts`
  - Backfill or claim the legacy dataset for `velascoborja@gmail.com`.

### Routes and pages

- Modify: `src/app/page.tsx`
  - Replace redirect behavior with the public landing page and signed-in redirect.
- Create: `src/components/landing/public-hero.tsx`
  - Render the main landing hero and CTA.
- Create: `src/components/auth/google-sign-in-button.tsx`
  - Trigger Google sign-in with the current callback strategy.
- Create: `src/components/auth/user-menu.tsx`
  - Show session info and sign-out action inside the private shell.
- Modify: `src/components/layout/app-shell.tsx`
  - Display session-aware controls in the authenticated header.
- Modify: `src/app/layout.tsx`
  - Wire in any auth providers or global session-safe markup if needed.
- Modify: `src/app/[year]/overview/page.tsx`
- Modify: `src/app/[year]/summary/page.tsx`
- Modify: `src/app/[year]/[month]/page.tsx`
- Modify: `src/app/setup/[year]/page.tsx`
  - Require session before loading private views.

### API routes

- Modify: `src/app/api/years/route.ts`
- Modify: `src/app/api/years/[year]/route.ts`
- Modify: `src/app/api/years/[year]/prefill/route.ts`
- Modify: `src/app/api/years/[year]/export/route.ts`
- Modify: `src/app/api/months/[monthId]/route.ts`
- Modify: `src/app/api/months/[monthId]/entries/route.ts`
- Modify: `src/app/api/months/[monthId]/entries/[entryId]/route.ts`
  - Replace global record access with authenticated ownership checks.

### Tests

- Modify: `tests/no-localhost-ssr.test.mjs`
  - Keep existing SSR constraint coverage.
- Create: `tests/server/year-data.test.mjs`
  - Verify user-scoped year listing and redirect-target behavior.
- Create: `tests/server/ownership.test.mjs`
  - Verify unauthorized and cross-user access handling.
- Create: `tests/server/legacy-user.test.mjs`
  - Verify legacy dataset assignment logic.

## Task 1: Install auth dependencies and establish a passing test baseline

**Files:**
- Modify: `package.json`
- Modify: `.env.example`

- [ ] **Step 1: Read the current installed Next.js auth guidance before changing code**

Run:

```bash
sed -n '1,260p' node_modules/next/dist/docs/01-app/02-guides/authentication.md
```

Expected: Next.js App Router guidance that recommends using an auth library and server-side authorization checks.

- [ ] **Step 2: Create a failing baseline by running the existing tests**

Run:

```bash
node --test tests/no-localhost-ssr.test.mjs
```

Expected: PASS.

- [ ] **Step 3: Add the auth and test dependencies in `package.json`**

Use this dependency shape:

```json
{
  "dependencies": {
    "@auth/drizzle-adapter": "^1.11.0",
    "next-auth": "^5.0.0-beta.25"
  },
  "scripts": {
    "test": "node --test"
  }
}
```

If the currently resolved ecosystem requires a newer compatible beta, use the current stable compatible pair instead of forcing these exact patch versions.

- [ ] **Step 4: Document auth configuration in `.env.example`**

Add these variables:

```dotenv
AUTH_SECRET=
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=
```

- [ ] **Step 5: Install dependencies and run the existing test again**

Run:

```bash
npm install
node --test tests/no-localhost-ssr.test.mjs
```

Expected: install succeeds and the existing test still passes.

- [ ] **Step 6: Commit the dependency baseline**

Run:

```bash
git add package.json package-lock.json .env.example
git commit -m "chore: add auth dependencies"
```

Expected: one commit containing only dependency and env-example updates.

## Task 2: Add auth tables and user ownership to the schema

**Files:**
- Modify: `src/db/schema.ts`
- Optional Create: `src/db/auth-schema.ts`

- [ ] **Step 1: Write the failing schema ownership test**

Create `tests/server/legacy-user.test.mjs` with this shape:

```js
import test from "node:test";
import assert from "node:assert/strict";

test("legacy owner email is the only seeded owner", () => {
  assert.equal("velascoborja@gmail.com", "velascoborja@gmail.com");
});
```

Then immediately replace the placeholder assertion with imports from the legacy-owner module once that module exists later in the task sequence.

- [ ] **Step 2: Run the new test file to verify the suite is wired up**

Run:

```bash
node --test tests/server/legacy-user.test.mjs
```

Expected: PASS for the placeholder shape so the test harness is confirmed before deeper assertions are added.

- [ ] **Step 3: Update the Drizzle schema for auth and year ownership**

Implement these schema changes:

```ts
export const users = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: timestamp("email_verified", { mode: "date" }),
  image: text("image"),
});

export const accounts = pgTable("accounts", {
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  provider: text("provider").notNull(),
  providerAccountId: text("provider_account_id").notNull(),
  refresh_token: text("refresh_token"),
  access_token: text("access_token"),
  expires_at: integer("expires_at"),
  token_type: text("token_type"),
  scope: text("scope"),
  id_token: text("id_token"),
  session_state: text("session_state"),
}, (t) => [primaryKey({ columns: [t.provider, t.providerAccountId] })]);
```

Add matching `sessions` and `verificationTokens` tables per the adapter docs, and update `years` to include:

```ts
userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
```

Then replace global uniqueness with a composite uniqueness on `(userId, year)`.

- [ ] **Step 4: Tighten `userId` to be required after backfill-safe migration shape is in place**

Use a staged shape if needed:

```ts
userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
```

Followed by application-level enforcement until the production data is backfilled. If the codebase uses `drizzle-kit push` directly rather than migration files, document the required sequencing in comments or the final summary instead of pretending a generated migration file exists.

- [ ] **Step 5: Run lint or TypeScript validation on the schema files**

Run:

```bash
npm run lint
```

Expected: PASS.

- [ ] **Step 6: Commit the schema changes**

Run:

```bash
git add src/db/schema.ts src/db/auth-schema.ts tests/server/legacy-user.test.mjs
git commit -m "feat: add auth schema and year ownership"
```

If no split file is created, omit `src/db/auth-schema.ts` from the staged paths.

## Task 3: Configure Auth.js and session helpers

**Files:**
- Create: `src/lib/server/auth-config.ts`
- Create: `src/auth.ts`
- Create: `src/lib/server/session.ts`
- Create: `src/lib/server/legacy-user.ts`

- [ ] **Step 1: Write the failing legacy-owner module test**

Replace the placeholder test with:

```js
import test from "node:test";
import assert from "node:assert/strict";
import { LEGACY_OWNER_EMAIL } from "../../src/lib/server/legacy-user.js";

test("legacy owner email is fixed to the approved account", () => {
  assert.equal(LEGACY_OWNER_EMAIL, "velascoborja@gmail.com");
});
```

If the project compiles tests from TypeScript instead, mirror this test in the active test format. The point is to lock the owner constant before implementation.

- [ ] **Step 2: Run the test and verify it fails because the module does not exist yet**

Run:

```bash
node --test tests/server/legacy-user.test.mjs
```

Expected: FAIL with module-not-found or missing export error.

- [ ] **Step 3: Implement the auth configuration**

Create `src/lib/server/auth-config.ts` with this shape:

```ts
import Google from "next-auth/providers/google";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import type { NextAuthConfig } from "next-auth";
import { db } from "@/db";

export const authConfig = {
  adapter: DrizzleAdapter(db),
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID ?? "",
      clientSecret: process.env.AUTH_GOOGLE_SECRET ?? "",
    }),
  ],
  callbacks: {},
} satisfies NextAuthConfig;
```

Then create `src/auth.ts` using the current Auth.js v5 integration pattern so the app exports `auth`, `handlers`, `signIn`, and `signOut`.

- [ ] **Step 4: Implement session and legacy-owner helpers**

Create `src/lib/server/session.ts` with helper shapes like:

```ts
import { redirect } from "next/navigation";
import { auth } from "@/auth";

export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) redirect("/");
  return session.user;
}
```

Create `src/lib/server/legacy-user.ts` with:

```ts
export const LEGACY_OWNER_EMAIL = "velascoborja@gmail.com";
```

Add a backfill helper that ensures the legacy user row exists and can be used to claim old `years` rows lacking `userId`.

- [ ] **Step 5: Run the legacy-owner test again**

Run:

```bash
node --test tests/server/legacy-user.test.mjs
```

Expected: PASS.

- [ ] **Step 6: Commit the auth foundation**

Run:

```bash
git add src/lib/server/auth-config.ts src/auth.ts src/lib/server/session.ts src/lib/server/legacy-user.ts tests/server/legacy-user.test.mjs
git commit -m "feat: configure Google auth"
```

## Task 4: Make data-access helpers user-scoped

**Files:**
- Modify: `src/lib/server/year-data.ts`
- Create: `src/lib/server/ownership.ts`
- Create: `tests/server/year-data.test.mjs`
- Create: `tests/server/ownership.test.mjs`

- [ ] **Step 1: Write the failing year-scope test**

Create `tests/server/year-data.test.mjs` with:

```js
import test from "node:test";
import assert from "node:assert/strict";
import { pickDefaultYear } from "../../src/lib/server/year-data.js";

test("pickDefaultYear prefers the current year when available", () => {
  assert.equal(pickDefaultYear([2024, 2026], 2026), 2026);
});
```

- [ ] **Step 2: Run the year-scope test and verify it fails**

Run:

```bash
node --test tests/server/year-data.test.mjs
```

Expected: FAIL because `pickDefaultYear` does not exist yet.

- [ ] **Step 3: Add pure helper functions to `src/lib/server/year-data.ts`**

Implement helper shapes such as:

```ts
export function pickDefaultYear(years: number[], currentYear: number) {
  if (years.includes(currentYear)) return currentYear;
  return years.toSorted((a, b) => b - a)[0] ?? currentYear;
}
```

Then change the existing async functions to accept `userId`:

```ts
export async function getYearData(userId: string, year: number): Promise<YearData | null> {}
export async function getYears(userId: string): Promise<number[]> {}
```

- [ ] **Step 4: Add ownership resolvers in `src/lib/server/ownership.ts`**

Implement helpers shaped like:

```ts
export async function getOwnedYear(userId: string, year: number) {}
export async function getOwnedMonth(userId: string, monthId: number) {}
export async function getOwnedEntry(userId: string, entryId: number) {}
```

These helpers should return `null` for "not found or not yours" so routes can normalize to `404`.

- [ ] **Step 5: Write and run a focused ownership test**

Create `tests/server/ownership.test.mjs` with a pure-function target if the DB is too heavy for node:test. For example, extract a small helper:

```js
import test from "node:test";
import assert from "node:assert/strict";
import { isOwnedRecord } from "../../src/lib/server/ownership.js";

test("isOwnedRecord is false when record owner does not match user id", () => {
  assert.equal(isOwnedRecord("user-a", { userId: "user-b" }), false);
});
```

Run:

```bash
node --test tests/server/year-data.test.mjs tests/server/ownership.test.mjs
```

Expected: PASS.

- [ ] **Step 6: Commit the user-scoped data helpers**

Run:

```bash
git add src/lib/server/year-data.ts src/lib/server/ownership.ts tests/server/year-data.test.mjs tests/server/ownership.test.mjs
git commit -m "feat: scope finance data to authenticated users"
```

## Task 5: Protect the finance API routes

**Files:**
- Modify: `src/app/api/years/route.ts`
- Modify: `src/app/api/years/[year]/route.ts`
- Modify: `src/app/api/years/[year]/prefill/route.ts`
- Modify: `src/app/api/years/[year]/export/route.ts`
- Modify: `src/app/api/months/[monthId]/route.ts`
- Modify: `src/app/api/months/[monthId]/entries/route.ts`
- Modify: `src/app/api/months/[monthId]/entries/[entryId]/route.ts`

- [ ] **Step 1: Write the failing unauthorized-route test**

Add a focused pure helper test in `tests/server/ownership.test.mjs`:

```js
test("unauthenticated API requests should map to 401", () => {
  assert.equal(statusForAuth(false), 401);
});
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run:

```bash
node --test tests/server/ownership.test.mjs
```

Expected: FAIL because `statusForAuth` does not exist yet.

- [ ] **Step 3: Implement route-level auth guards**

Each route should use the same pattern:

```ts
const user = await getRequestUser();
if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
```

Then resolve owned resources through `ownership.ts` before reads or writes. For example:

```ts
const yearRow = await getOwnedYear(user.id, yearNum);
if (!yearRow) return Response.json({ error: "Year not found" }, { status: 404 });
```

Apply the equivalent parent-ownership lookup for month and additional-entry routes.

- [ ] **Step 4: Add `statusForAuth` or equivalent tiny helper and make the test pass**

Use:

```ts
export function statusForAuth(isAuthenticated: boolean) {
  return isAuthenticated ? 200 : 401;
}
```

This helper exists only to give node:test a stable unit target for the auth-status behavior.

- [ ] **Step 5: Run the server tests and lint**

Run:

```bash
node --test tests/server/legacy-user.test.mjs tests/server/year-data.test.mjs tests/server/ownership.test.mjs tests/no-localhost-ssr.test.mjs
npm run lint
```

Expected: PASS.

- [ ] **Step 6: Commit the protected APIs**

Run:

```bash
git add src/app/api/years/route.ts src/app/api/years/[year]/route.ts src/app/api/years/[year]/prefill/route.ts src/app/api/years/[year]/export/route.ts src/app/api/months/[monthId]/route.ts src/app/api/months/[monthId]/entries/route.ts src/app/api/months/[monthId]/entries/[entryId]/route.ts src/lib/server/ownership.ts tests/server/ownership.test.mjs
git commit -m "feat: protect finance api routes"
```

## Task 6: Protect private pages and route users correctly after sign-in

**Files:**
- Modify: `src/app/[year]/overview/page.tsx`
- Modify: `src/app/[year]/summary/page.tsx`
- Modify: `src/app/[year]/[month]/page.tsx`
- Modify: `src/app/setup/[year]/page.tsx`
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Write the failing redirect-target test**

Extend `tests/server/year-data.test.mjs` with:

```js
test("pickDefaultYear falls back to the latest available year", () => {
  assert.equal(pickDefaultYear([2023, 2025], 2026), 2025);
});
```

- [ ] **Step 2: Run the test and verify the current helper set fails until implemented fully**

Run:

```bash
node --test tests/server/year-data.test.mjs
```

Expected: FAIL if the fallback behavior is not implemented yet.

- [ ] **Step 3: Update private pages to require session and use user-scoped year helpers**

Use a consistent pattern:

```ts
const user = await requireUser();
const [yearData, years] = await Promise.all([
  getYearData(user.id, year),
  getYears(user.id),
]);
```

Use `pickDefaultYear` or a similar helper to decide where signed-in users should be redirected after entering the app.

- [ ] **Step 4: Replace `/` with signed-in redirect or public landing wrapper**

`src/app/page.tsx` should:

```ts
const session = await auth();
if (session?.user?.id) redirect(`/${targetYear}/overview`);
return <PublicLanding />;
```

If the user has no years, redirect them to `/setup/${currentYear}` instead of showing a dead-end authenticated landing page.

- [ ] **Step 5: Run relevant tests and lint**

Run:

```bash
node --test tests/server/year-data.test.mjs tests/no-localhost-ssr.test.mjs
npm run lint
```

Expected: PASS.

- [ ] **Step 6: Commit private-route protection**

Run:

```bash
git add src/app/[year]/overview/page.tsx src/app/[year]/summary/page.tsx src/app/[year]/[month]/page.tsx src/app/setup/[year]/page.tsx src/app/page.tsx src/lib/server/year-data.ts tests/server/year-data.test.mjs
git commit -m "feat: protect private finance pages"
```

## Task 7: Build the public landing page and session-aware header

**Files:**
- Create: `src/components/landing/public-hero.tsx`
- Create: `src/components/auth/google-sign-in-button.tsx`
- Create: `src/components/auth/user-menu.tsx`
- Modify: `src/components/layout/app-shell.tsx`
- Optional Modify: `src/app/globals.css`

- [ ] **Step 1: Write the failing SSR landing test**

Extend `tests/no-localhost-ssr.test.mjs` to include:

```js
"src/app/page.tsx",
"src/components/landing/public-hero.tsx",
```

This keeps the landing implementation from introducing local-host self-fetching.

- [ ] **Step 2: Run the SSR test and verify it fails if the new files are missing**

Run:

```bash
node --test tests/no-localhost-ssr.test.mjs
```

Expected: FAIL until the new file is created and the test list is updated consistently.

- [ ] **Step 3: Implement the Google CTA and landing hero**

Use a server action or auth helper pattern compatible with the current App Router auth setup. The landing hero should include:

```tsx
<h1>Controla tu panorama financiero con claridad.</h1>
<p>Resumen anual, control mensual y exportación en un solo flujo.</p>
<GoogleSignInButton />
```

The styling should follow the existing design language: light background, premium violet CTA, polished preview card, Spanish copy only.

- [ ] **Step 4: Add session-aware controls to the authenticated shell**

Add a compact user menu shape such as:

```tsx
<div className="flex items-center gap-3">
  <span className="text-xs text-muted-foreground">{user.email}</span>
  <form action={signOutAction}>
    <Button type="submit" variant="outline">Salir</Button>
  </form>
</div>
```

- [ ] **Step 5: Run SSR test and lint**

Run:

```bash
node --test tests/no-localhost-ssr.test.mjs
npm run lint
```

Expected: PASS.

- [ ] **Step 6: Commit the landing and shell changes**

Run:

```bash
git add src/app/page.tsx src/components/landing/public-hero.tsx src/components/auth/google-sign-in-button.tsx src/components/auth/user-menu.tsx src/components/layout/app-shell.tsx tests/no-localhost-ssr.test.mjs src/app/globals.css
git commit -m "feat: add public landing and session controls"
```

Omit `src/app/globals.css` if no style changes are needed.

## Task 8: Final verification and docs touch-up

**Files:**
- Modify: `README.md`
- Optional Modify: `AGENTS.md`

- [ ] **Step 1: Document the auth setup and first-login behavior**

Update `README.md` to mention:

```md
- Google sign-in is required for private finance data.
- Existing legacy data is assigned to `velascoborja@gmail.com`.
- New users start with an empty account and create their own year setup.
```

- [ ] **Step 2: Run the full verification suite**

Run:

```bash
node --test
npm run lint
npm run build
```

Expected: PASS.

- [ ] **Step 3: Commit the documentation and verification pass**

Run:

```bash
git add README.md
git commit -m "docs: document Google auth setup"
```

- [ ] **Step 4: Prepare the branch for review**

Run:

```bash
git status --short
git log --oneline --decorate -5
```

Expected: clean working tree and a readable commit sequence for review.
