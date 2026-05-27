# Tag Mobile Color Palette Animation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a subtle mobile-only fade/slide/height animation when the Settings tag color palette opens and closes.

**Architecture:** This is a CSS-class-only animation change inside the existing `TagManagerCard` client component. Keep `expandedColorTagId` as the source of truth, keep the palette mounted on mobile, and animate between collapsed and expanded classes while preserving desktop's always-visible palette.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS v4, node:test characterization tests.

---

## File Structure

- Modify `src/components/settings/tag-manager-card.test.ts`: update the mobile swatch characterization to require animated mounted palette classes and reject instant `hidden sm:flex` switching.
- Modify `src/components/settings/tag-manager-card.tsx`: replace the mobile hidden/flex palette classes with transition, overflow, max-height, opacity, and translate classes.
- Modify `docs/features/tags.md`: document the subtle mobile palette animation.

---

### Task 1: Characterize animated mounted palette classes

**Files:**
- Modify: `src/components/settings/tag-manager-card.test.ts`
- Test: `src/components/settings/tag-manager-card.test.ts`

- [ ] **Step 1: Update the mobile palette assertions**

In `src/components/settings/tag-manager-card.test.ts`, inside `TagManagerCard rows use a compact selected-color swatch on mobile`, replace:

```ts
  assert.match(source, /expandedColorTagId === tag\.id \? "flex" : "hidden sm:flex"/);
```

with:

```ts
  assert.match(source, /"overflow-hidden transition-\[max-height,opacity,transform\] duration-200 ease-out sm:overflow-visible sm:transition-none"/);
  assert.match(source, /expandedColorTagId === tag\.id\s+\? "max-h-10 opacity-100 translate-y-0"\s+: "max-h-0 opacity-0 -translate-y-1 sm:max-h-none sm:opacity-100 sm:translate-y-0"/);
  assert.doesNotMatch(source, /expandedColorTagId === tag\.id \? "flex" : "hidden sm:flex"/);
```

- [ ] **Step 2: Run the targeted test and verify it fails**

Run:

```bash
npm test -- src/components/settings/tag-manager-card.test.ts
```

Expected: FAIL in `TagManagerCard rows use a compact selected-color swatch on mobile` because the current source still switches between `flex` and `hidden sm:flex`.

---

### Task 2: Implement subtle mobile palette animation

**Files:**
- Modify: `src/components/settings/tag-manager-card.tsx`
- Test: `src/components/settings/tag-manager-card.test.ts`

- [ ] **Step 1: Replace instant visibility classes with animation classes**

In `src/components/settings/tag-manager-card.tsx`, replace:

```tsx
className={cn(
  "flex flex-nowrap items-center justify-center gap-1.5 sm:gap-1",
  expandedColorTagId === tag.id ? "flex" : "hidden sm:flex"
)}
```

with:

```tsx
className={cn(
  "flex flex-nowrap items-center justify-center gap-1.5 overflow-hidden transition-[max-height,opacity,transform] duration-200 ease-out sm:gap-1 sm:overflow-visible sm:transition-none",
  expandedColorTagId === tag.id
    ? "max-h-10 opacity-100 translate-y-0"
    : "max-h-0 opacity-0 -translate-y-1 sm:max-h-none sm:opacity-100 sm:translate-y-0"
)}
```

- [ ] **Step 2: Run the targeted test and verify it passes**

Run:

```bash
npm test -- src/components/settings/tag-manager-card.test.ts
```

Expected: PASS for all `TagManagerCard` tests.

- [ ] **Step 3: Commit the implementation**

Run:

```bash
git add src/components/settings/tag-manager-card.tsx src/components/settings/tag-manager-card.test.ts
git commit -m "fix: animate mobile tag color palette"
```

---

### Task 3: Update documentation and validate

**Files:**
- Modify: `docs/features/tags.md`
- Test: `src/components/settings/tag-manager-card.test.ts`

- [ ] **Step 1: Update the Settings tag manager documentation**

In `docs/features/tags.md`, replace:

```md
- Uses a mobile-specific compact edit layout: the name input sits beside the currently selected color swatch, tapping that swatch reveals the row's color palette, and the action row keeps a fixed-width Save button plus compact Delete button aligned to the right. At `sm` and above, rows keep the compact desktop single-line grid with the full palette always visible.
```

with:

```md
- Uses a mobile-specific compact edit layout: the name input sits beside the currently selected color swatch, tapping that swatch reveals the row's color palette with a subtle fade/slide/height animation, and the action row keeps a fixed-width Save button plus compact Delete button aligned to the right. At `sm` and above, rows keep the compact desktop single-line grid with the full palette always visible.
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
git commit -m "docs: document mobile tag palette animation"
```

---

## Self-Review

Spec coverage:
- Fade/slide/max-height animation: Task 1 Step 1 and Task 2 Step 1.
- Short 150-200ms motion: Task 2 Step 1 uses `duration-200`.
- Desktop always visible and non-distracting: Task 2 Step 1 uses `sm:max-h-none`, `sm:opacity-100`, `sm:translate-y-0`, and `sm:transition-none`.
- Palette remains mounted for CSS animation: Task 1 rejects the old `hidden sm:flex` toggle.
- Existing save/delete behavior unchanged: plan only edits palette classes and documentation.
- Feature docs updated: Task 3 Step 1.

Placeholder scan: complete; no incomplete work markers or ambiguous edge-case placeholders remain.

Type consistency: no new TypeScript types, props, methods, or translations are introduced.
