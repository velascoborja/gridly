# Tag Settings Save Button Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the mobile tag settings Save button fixed-width and right-aligned instead of growing to fill its parent.

**Architecture:** This is a presentation-only follow-up inside the existing `TagManagerCard` client component. The component keeps the same state, API calls, pending states, errors, and confirmation dialog; only responsive Tailwind classes on the existing action row and Save button change.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS v4, node:test characterization tests.

---

## File Structure

- Modify `src/components/settings/tag-manager-card.test.ts`: update the mobile layout characterization so it requires right-aligned actions and rejects a growing Save button.
- Modify `src/components/settings/tag-manager-card.tsx`: replace mobile `flex-1` Save sizing with fixed `min-w-20` sizing and right-align the action row.
- Modify `docs/features/tags.md`: update the Settings tag manager documentation to describe fixed-width right-aligned Save on mobile.

---

### Task 1: Characterize fixed-width mobile Save alignment

**Files:**
- Modify: `src/components/settings/tag-manager-card.test.ts`
- Test: `src/components/settings/tag-manager-card.test.ts`

- [ ] **Step 1: Update the failing mobile layout assertions**

In `src/components/settings/tag-manager-card.test.ts`, replace this block in `TagManagerCard rows use a tightened stacked layout on mobile`:

```ts
  assert.match(source, /className="flex items-center gap-2 sm:justify-end"/);
  assert.match(source, /className="min-w-0 flex-1 gap-1\.5 sm:min-w-20 sm:flex-none"/);
```

with:

```ts
  assert.match(source, /className="flex items-center justify-end gap-2"/);
  assert.match(source, /className="min-w-20 gap-1\.5"/);
  assert.doesNotMatch(source, /className="[^"]*flex-1[^"]*"/);
```

- [ ] **Step 2: Run the targeted test and verify it fails**

Run:

```bash
npm test -- src/components/settings/tag-manager-card.test.ts
```

Expected: FAIL in `TagManagerCard rows use a tightened stacked layout on mobile` because the current source still uses `flex items-center gap-2 sm:justify-end` and `min-w-0 flex-1 gap-1.5 sm:min-w-20 sm:flex-none`.

---

### Task 2: Implement fixed-width right-aligned Save actions

**Files:**
- Modify: `src/components/settings/tag-manager-card.tsx`
- Test: `src/components/settings/tag-manager-card.test.ts`

- [ ] **Step 1: Right-align the mobile action row**

In `src/components/settings/tag-manager-card.tsx`, replace:

```tsx
<div className="flex items-center gap-2 sm:justify-end">
```

with:

```tsx
<div className="flex items-center justify-end gap-2">
```

- [ ] **Step 2: Make Save fixed-width instead of growing**

Replace:

```tsx
className="min-w-0 flex-1 gap-1.5 sm:min-w-20 sm:flex-none"
```

with:

```tsx
className="min-w-20 gap-1.5"
```

- [ ] **Step 3: Run the targeted test and verify it passes**

Run:

```bash
npm test -- src/components/settings/tag-manager-card.test.ts
```

Expected: PASS for all `TagManagerCard` tests.

- [ ] **Step 4: Commit the implementation**

Run:

```bash
git add src/components/settings/tag-manager-card.tsx src/components/settings/tag-manager-card.test.ts
git commit -m "fix: right-align tag save action on mobile"
```

---

### Task 3: Update feature documentation and validate

**Files:**
- Modify: `docs/features/tags.md`
- Test: `src/components/settings/tag-manager-card.test.ts`

- [ ] **Step 1: Update the responsive layout documentation**

In `docs/features/tags.md`, replace:

```md
- Uses a mobile-specific stacked edit layout: full-width name input, centered single-line color palette, and an action row with a full-width Save button plus compact Delete button. At `sm` and above, rows keep the compact desktop single-line grid.
```

with:

```md
- Uses a mobile-specific stacked edit layout: full-width name input, centered single-line color palette, and a right-aligned action row with a fixed-width Save button plus compact Delete button. At `sm` and above, rows keep the compact desktop single-line grid.
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

- [ ] **Step 4: Run lint for the touched component**

Run:

```bash
npm run lint -- src/components/settings/tag-manager-card.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit the documentation update**

Run:

```bash
git add docs/features/tags.md
git commit -m "docs: update tag save button mobile layout"
```

---

## Self-Review

Spec coverage:
- Right-aligned mobile action row: Task 1 Step 1 and Task 2 Step 1.
- Fixed-width Save button with no growing `flex-1`: Task 1 Step 1 and Task 2 Step 2.
- Existing behavior unchanged: plan only edits classes and documentation.
- Feature docs updated: Task 3 Step 1.

Placeholder scan: complete; no incomplete work markers or ambiguous edge-case placeholders remain.

Type consistency: no new TypeScript types, props, methods, or translations are introduced.
