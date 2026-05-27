# Tag Settings Mobile Color Swatch Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make mobile tag rows show only the name input plus selected color swatch until the user taps the swatch to change colors.

**Architecture:** This is a client-side presentation and state change inside `TagManagerCard`. Add a small `expandedColorTagId` state to track the one mobile row with visible color choices, render a mobile-only input/swatch row, hide the full palette on mobile unless expanded, and keep the existing desktop palette visible from `sm` upward.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS v4, node:test characterization tests.

---

## File Structure

- Modify `src/components/settings/tag-manager-card.test.ts`: require the mobile selected-color swatch trigger, mobile-only expandable palette classes, expanded row state, and preserved desktop palette.
- Modify `src/components/settings/tag-manager-card.tsx`: add expanded mobile palette state, wrap the input with a mobile swatch trigger, hide/reveal the mobile palette, and close it after color selection.
- Modify `docs/features/tags.md`: document the compact mobile selected-color swatch behavior.

---

### Task 1: Characterize mobile selected-color swatch behavior

**Files:**
- Modify: `src/components/settings/tag-manager-card.test.ts`
- Test: `src/components/settings/tag-manager-card.test.ts`

- [ ] **Step 1: Add mobile swatch source assertions**

In `src/components/settings/tag-manager-card.test.ts`, replace the `TagManagerCard rows use a tightened stacked layout on mobile` test with:

```ts
test("TagManagerCard rows use a compact selected-color swatch on mobile", () => {
  assert.match(
    source,
    /const \[expandedColorTagId, setExpandedColorTagId\] = useState<number \| null>\(null\)/
  );
  assert.match(
    source,
    /className="grid gap-3 rounded-xl border border-border\/70 bg-background p-3 shadow-sm transition-shadow hover:shadow-md sm:grid-cols-\[minmax\(7rem,12rem\)_1fr_auto\] sm:items-center sm:gap-2"/
  );
  assert.match(source, /<div className="flex min-w-0 items-center gap-2 sm:max-w-48">/);
  assert.match(source, /aria-label=\{t\("selectColor", \{ color: draft\?\.color \?\? tag\.color \}\)\}/);
  assert.match(source, /setExpandedColorTagId\(\(current\) => \(current === tag\.id \? null : tag\.id\)\)/);
  assert.match(source, /style=\{\{ background: TAG_COLORS\[draft\?\.color \?\? tag\.color\]\.text \}\}/);
  assert.match(source, /className=\{cn\("flex flex-nowrap items-center justify-center gap-1\.5 sm:gap-1", expandedColorTagId === tag\.id \? "flex" : "hidden sm:flex"\)\}/);
  assert.match(source, /setExpandedColorTagId\(null\)/);
  assert.match(source, /className="min-w-20 gap-1\.5"/);
  assert.doesNotMatch(source, /className="[^"]*flex-1[^"]*"/);
});
```

- [ ] **Step 2: Run the targeted test and verify it fails**

Run:

```bash
npm test -- src/components/settings/tag-manager-card.test.ts
```

Expected: FAIL in `TagManagerCard rows use a compact selected-color swatch on mobile` because `expandedColorTagId`, the selected swatch trigger, and the mobile hidden palette classes do not exist yet.

---

### Task 2: Implement mobile selected-color swatch

**Files:**
- Modify: `src/components/settings/tag-manager-card.tsx`
- Test: `src/components/settings/tag-manager-card.test.ts`

- [ ] **Step 1: Add expanded row state**

After:

```tsx
const [deleteCandidate, setDeleteCandidate] = useState<Tag | null>(null);
```

add:

```tsx
const [expandedColorTagId, setExpandedColorTagId] = useState<number | null>(null);
```

- [ ] **Step 2: Replace the input wrapper with an input plus mobile swatch trigger**

Replace:

```tsx
<div className="min-w-0 sm:max-w-48">
```

with:

```tsx
<div className="flex min-w-0 items-center gap-2 sm:max-w-48">
```

Inside that wrapper, immediately after the `<Input />`, add:

```tsx
<button
  type="button"
  className={cn(
    "flex size-9 shrink-0 items-center justify-center rounded-lg border bg-background shadow-sm transition-all hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:hidden",
    isRowPending ? "cursor-not-allowed opacity-60" : ""
  )}
  style={{ borderColor: TAG_COLORS[draft?.color ?? tag.color].text }}
  onClick={() => setExpandedColorTagId((current) => (current === tag.id ? null : tag.id))}
  disabled={isRowPending}
  aria-label={t("selectColor", { color: draft?.color ?? tag.color })}
  aria-expanded={expandedColorTagId === tag.id}
>
  <span
    className="size-4 rounded-full shadow-sm"
    style={{ background: TAG_COLORS[draft?.color ?? tag.color].text }}
  />
</button>
```

- [ ] **Step 3: Hide the palette on mobile unless the row is expanded**

Replace:

```tsx
<div className="flex flex-nowrap items-center justify-center gap-1.5 sm:gap-1" aria-label={t("colorLabel")}>
```

with:

```tsx
<div
  className={cn(
    "flex flex-nowrap items-center justify-center gap-1.5 sm:gap-1",
    expandedColorTagId === tag.id ? "flex" : "hidden sm:flex"
  )}
  aria-label={t("colorLabel")}
>
```

- [ ] **Step 4: Close the mobile palette after choosing a color**

Replace:

```tsx
onClick={() => updateDraft(tag.id, { color: colorKey })}
```

with:

```tsx
onClick={() => {
  updateDraft(tag.id, { color: colorKey });
  setExpandedColorTagId(null);
}}
```

- [ ] **Step 5: Run the targeted test and verify it passes**

Run:

```bash
npm test -- src/components/settings/tag-manager-card.test.ts
```

Expected: PASS for all `TagManagerCard` tests.

- [ ] **Step 6: Commit the implementation**

Run:

```bash
git add src/components/settings/tag-manager-card.tsx src/components/settings/tag-manager-card.test.ts
git commit -m "fix: collapse mobile tag colors behind swatch"
```

---

### Task 3: Update documentation and validate

**Files:**
- Modify: `docs/features/tags.md`
- Test: `src/components/settings/tag-manager-card.test.ts`

- [ ] **Step 1: Update the Settings tag manager documentation**

In `docs/features/tags.md`, replace:

```md
- Uses a mobile-specific stacked edit layout: full-width name input, centered single-line color palette, and a right-aligned action row with a fixed-width Save button plus compact Delete button. At `sm` and above, rows keep the compact desktop single-line grid.
```

with:

```md
- Uses a mobile-specific compact edit layout: the name input sits beside the currently selected color swatch, tapping that swatch reveals the row's color palette, and the action row keeps a fixed-width Save button plus compact Delete button aligned to the right. At `sm` and above, rows keep the compact desktop single-line grid with the full palette always visible.
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
git commit -m "docs: document mobile tag color swatch"
```

---

## Self-Review

Spec coverage:
- Mobile name input plus selected color swatch: Task 1 Step 1 and Task 2 Step 2.
- Tap swatch to reveal colors: Task 1 Step 1 and Task 2 Step 3.
- Choosing a color closes palette: Task 1 Step 1 and Task 2 Step 4.
- Only one row open: `expandedColorTagId` stores one tag id or null in Task 2 Step 1.
- Desktop full palette preserved: Task 2 Step 3 uses `hidden sm:flex` when collapsed.
- Existing save/delete behavior unchanged: plan only adds color-expansion state and class/render changes.
- Feature docs updated: Task 3 Step 1.

Placeholder scan: complete; no incomplete work markers or ambiguous edge-case placeholders remain.

Type consistency: `expandedColorTagId` is consistently typed as `number | null`.
