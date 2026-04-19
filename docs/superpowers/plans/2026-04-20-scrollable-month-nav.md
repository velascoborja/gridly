# Scrollable Month Navigation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a horizontally scrollable month navigation that centers the active month on mobile.

**Architecture:** Enhancing the `NavSelectors` component with React `useRef` and `useEffect` to trigger `scrollIntoView` on the active month element. Using Tailwind CSS for snap-scrolling and clean mobile UI.

**Tech Stack:** React 19, Next.js 16 (App Router), Tailwind CSS v4.

---

### Task 1: Ref and Centering Logic

**Files:**
- Modify: `src/components/layout/nav-selectors.tsx`

- [ ] **Step 1: Add `useRef` and `useEffect` for centering**

```tsx
// Inside NavSelectors component
const scrollContainerRef = useRef<HTMLDivElement>(null);

useEffect(() => {
  if (view === "detail" && currentMonth && scrollContainerRef.current) {
    const activeItem = scrollContainerRef.current.querySelector('[aria-current="page"]');
    if (activeItem) {
      activeItem.scrollIntoView({
        behavior: "instant",
        block: "nearest",
        inline: "center",
      });
    }
  }
}, [currentMonth, view]);

// Add ref to the container:
// <div ref={scrollContainerRef} className="...">
```

- [ ] **Step 2: Verify logic with a manual check (simulated)**
Expectation: When `view` is "detail", the `useEffect` should find the element with `aria-current="page"` and call `scrollIntoView`.

- [ ] **Step 3: Commit**

```bash
git add src/components/layout/nav-selectors.tsx
git commit -m "feat: add centering logic to month navigation"
```

### Task 2: CSS Styling for Snap-Scrolling

**Files:**
- Modify: `src/components/layout/nav-selectors.tsx`

- [ ] **Step 1: Apply Tailwind classes for snap-scrolling and cleanup**

```tsx
// Container:
// Add snap-x snap-mandatory scrollbar-hide
// Ensure it has enough padding to allow centering first/last items
// <div 
//   ref={scrollContainerRef}
//   className="flex justify-start gap-1 overflow-x-auto pb-1 md:pb-0 snap-x snap-mandatory scrollbar-hide px-4 md:px-0"
// >

// Items (Month Links):
// Add snap-center
// <Link
//   key={m}
//   className={`... snap-center ...`}
// >
```

- [ ] **Step 2: Commit styling changes**

```bash
git add src/components/layout/nav-selectors.tsx
git commit -m "style: add snap-scrolling and hide scrollbar for month nav"
```

### Task 3: Desktop Refinement

**Files:**
- Modify: `src/components/layout/nav-selectors.tsx`

- [ ] **Step 1: Ensure desktop view doesn't have unnecessary padding or snap behavior if months fit**

```tsx
// Adjust container classes:
// <div 
//   ref={scrollContainerRef}
//   className="flex justify-start gap-1 overflow-x-auto pb-1 md:pb-0 snap-x snap-mandatory scrollbar-hide px-8 sm:px-12 md:justify-center md:px-0 md:snap-none"
// >
```

- [ ] **Step 2: Commit final refinements**

```bash
git add src/components/layout/nav-selectors.tsx
git commit -m "style: refine month nav desktop alignment"
```
