# Tag Settings Mobile Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refine the Settings tag edit row on mobile so it uses a clearer stacked layout while preserving the existing desktop single-line layout and tag behavior.

**Architecture:** This is a presentation-only change inside the existing `TagManagerCard` client component. The component keeps the same state, API calls, pending states, errors, and confirmation dialog; only responsive Tailwind classes on the existing row, palette, and action containers change.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS v4, node:test characterization tests.

---

## File Structure

- Modify `src/components/settings/tag-manager-card.test.ts`: add a failing characterization test for the approved mobile layout and preserve desktop layout assertions.
- Modify `src/components/settings/tag-manager-card.tsx`: update responsive classes for the tag row, palette, and action row.
- Modify `docs/features/tags.md`: document the mobile-specific tag manager layout under the existing Settings tag manager section.

---

### Task 1: Characterize the approved mobile layout

**Files:**
- Modify: `src/components/settings/tag-manager-card.test.ts`
- Test: `src/components/settings/tag-manager-card.test.ts`

- [ ] **Step 1: Add the failing mobile layout test**

Append this test after `TagManagerCard rows use compact single-line controls on desktop`:

```ts
test("TagManagerCard rows use a tightened stacked layout on mobile", () => {
  assert.match(
    source,
    /className="grid gap-3 rounded-xl border border-border\/70 bg-background p-3 shadow-sm transition-shadow hover:shadow-md sm:grid-cols-\[minmax\(7rem,12rem\)_1fr_auto\] sm:items-center sm:gap-2"/
  );
  assert.match(source, /<div className="min-w-0 sm:max-w-48">/);
  assert.match(source, /className="flex flex-nowrap items-center justify-center gap-1\.5 sm:gap-1"/);
  assert.match(source, /className="flex items-center gap-2 sm:justify-end"/);
  assert.match(source, /className="min-w-0 flex-1 gap-1\.5 sm:min-w-20 sm:flex-none"/);
});
```

- [ ] **Step 2: Run the targeted test and verify it fails**

Run:

```bash
npm test -- src/components/settings/tag-manager-card.test.ts
```

Expected: FAIL in `TagManagerCard rows use a tightened stacked layout on mobile` because the current source still has `grid gap-2`, `min-w-0`, `gap-1`, `justify-end`, and `min-w-20 gap-1.5`.

- [ ] **Step 3: Commit the failing test**

Do not commit while the test is failing. This step is intentionally a checkpoint only: confirm `git diff -- src/components/settings/tag-manager-card.test.ts` contains only the new failing test.

---

### Task 2: Implement the mobile-only layout classes

**Files:**
- Modify: `src/components/settings/tag-manager-card.tsx`
- Test: `src/components/settings/tag-manager-card.test.ts`

- [ ] **Step 1: Update the tag row grid spacing**

In `src/components/settings/tag-manager-card.tsx`, replace the row container class:

```tsx
className="grid gap-2 rounded-xl border border-border/70 bg-background p-3 shadow-sm transition-shadow hover:shadow-md sm:grid-cols-[minmax(7rem,12rem)_1fr_auto] sm:items-center"
```

with:

```tsx
className="grid gap-3 rounded-xl border border-border/70 bg-background p-3 shadow-sm transition-shadow hover:shadow-md sm:grid-cols-[minmax(7rem,12rem)_1fr_auto] sm:items-center sm:gap-2"
```

- [ ] **Step 2: Keep the name input full-width on mobile and bounded on desktop**

Replace:

```tsx
<div className="min-w-0">
```

with:

```tsx
<div className="min-w-0 sm:max-w-48">
```

- [ ] **Step 3: Tighten the palette on desktop while giving mobile a little more breathing room**

Replace:

```tsx
<div className="flex flex-nowrap items-center justify-center gap-1" aria-label={t("colorLabel")}>
```

with:

```tsx
<div className="flex flex-nowrap items-center justify-center gap-1.5 sm:gap-1" aria-label={t("colorLabel")}>
```

- [ ] **Step 4: Make the mobile action row full-width with desktop right alignment preserved**

Replace:

```tsx
<div className="flex items-center justify-end gap-2">
```

with:

```tsx
<div className="flex items-center gap-2 sm:justify-end">
```

- [ ] **Step 5: Make Save fill mobile width and keep its desktop size**

Replace:

```tsx
className="min-w-20 gap-1.5"
```

with:

```tsx
className="min-w-0 flex-1 gap-1.5 sm:min-w-20 sm:flex-none"
```

- [ ] **Step 6: Run the targeted test and verify it passes**

Run:

```bash
npm test -- src/components/settings/tag-manager-card.test.ts
```

Expected: PASS for all `TagManagerCard` tests.

- [ ] **Step 7: Commit the implementation**

Run:

```bash
git add src/components/settings/tag-manager-card.tsx src/components/settings/tag-manager-card.test.ts
git commit -m "fix: refine mobile tag settings layout"
```

---

### Task 3: Update feature documentation and run validation

**Files:**
- Modify: `docs/features/tags.md`
- Test: `src/components/settings/tag-manager-card.test.ts`

- [ ] **Step 1: Document the responsive tag manager layout**

In `docs/features/tags.md`, under `### src/components/settings/tag-manager-card.tsx`, replace the existing bullet:

```md
- Shows localized loading, empty, and error states without blocking the rest of Settings.
```

with:

```md
- Shows localized loading, empty, and error states without blocking the rest of Settings.
- Uses a mobile-specific stacked edit layout: full-width name input, centered single-line color palette, and an action row with a full-width Save button plus compact Delete button. At `sm` and above, rows keep the compact desktop single-line grid.
```

- [ ] **Step 2: Run the targeted test**

Run:

```bash
npm test -- src/components/settings/tag-manager-card.test.ts
```

Expected: PASS.

- [ ] **Step 3: Run the project test suite**

Run:

```bash
npm test
```

Expected: PASS.

- [ ] **Step 4: Run lint**

Run:

```bash
npm run lint
```

Expected: PASS.

- [ ] **Step 5: Commit the documentation update**

Run:

```bash
git add docs/features/tags.md
git commit -m "docs: document mobile tag settings layout"
```

---

## Self-Review

Spec coverage:
- Mobile full-width name input: Task 2 Step 2.
- Centered single-line color palette: Task 2 Step 3.
- Full-width Save plus compact Delete action row: Task 2 Steps 4 and 5.
- Desktop/tablet single-line grid preserved: Task 1 test and Task 2 responsive `sm:` classes.
- Existing interactions unchanged: plan only edits classes and documentation, with no state or API changes.
- Feature docs updated: Task 3 Step 1.

Placeholder scan: complete; no incomplete work markers or ambiguous edge-case placeholders remain.

Type consistency: no new TypeScript types, props, methods, or translations are introduced.
