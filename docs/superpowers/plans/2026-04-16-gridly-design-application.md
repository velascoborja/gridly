# Gridly Design Application Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the approved `DESIGN.md`-inspired visual system across Gridly’s shell, shared controls, overview, annual summary, monthly detail, and setup states without changing finance behavior.

**Architecture:** Build the redesign in two layers. First, establish shared tokens and primitive styling in `globals.css` and `src/components/ui/` so the app has one visual language. Then do targeted composition passes in the shell and route-level view components to create stronger hierarchy, brand moments, and state handling while preserving current routing, data flow, and inline edit behavior.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS v4, shadcn/ui, Base UI, Lucide React

---

## File Map

### Shared system

- Modify: `src/app/globals.css`
  - Define the light-first premium palette, typography roles, number utilities, shadows, radii, and global page background treatments.
- Modify: `src/app/layout.tsx`
  - Keep the existing font loading strategy, set correct language metadata, and ensure the root shell classes support the updated background and typography.
- Modify: `src/components/ui/button.tsx`
  - Restyle variants and sizes to match the new control language.
- Modify: `src/components/ui/input.tsx`
  - Restyle inputs and focus states for finance editing clarity.
- Modify: `src/components/ui/card.tsx`
  - Tighten radii, borders, shadows, and header/content spacing.
- Modify: `src/components/ui/select.tsx`
  - Align shared select styling with the rest of the system if the component is already used or becomes the right replacement for raw selects.

### Shell and navigation

- Modify: `src/components/layout/app-shell.tsx`
  - Introduce the revised header, content canvas, and section rhythm.
- Modify: `src/components/layout/nav-selectors.tsx`
  - Replace raw selector/tab styling with the new segmented-control and select treatment.

### Overview and annual summary

- Modify: `src/components/monthly/month-overview.tsx`
  - Turn the current month screen into the “cockpit” layout with a stronger intro band, KPI row, and improved quick-add pair.
- Modify: `src/components/annual/annual-view.tsx`
  - Recompose actions, KPI region, chart region, and config region into a more editorial page structure.
- Modify: `src/components/annual/kpi-cards.tsx`
  - Restyle KPI cards and value emphasis for the annual summary.
- Modify: `src/components/annual/year-config-form.tsx`
  - Make the year config feel like a finance control panel rather than a flat list.
- Modify: `src/components/annual/balance-chart.tsx`
  - Adjust chart container chrome and chart typography/colors as needed.
- Modify: `src/components/annual/savings-chart.tsx`
  - Match the chart container and axis/value styling to the updated system.

### Monthly detail and inline editing

- Modify: `src/components/monthly/monthly-view.tsx`
  - Refine page rhythm and column composition.
- Modify: `src/components/monthly/fixed-expenses-card.tsx`
  - Bring fixed expense rows into the new visual system.
- Modify: `src/components/monthly/income-card.tsx`
  - Bring fixed income rows into the new visual system.
- Modify: `src/components/monthly/additional-entries-card.tsx`
  - Improve empty, add, edit, and delete affordances.
- Modify: `src/components/monthly/summary-card.tsx`
  - Make the summary card the visual anchor of the monthly detail page.
- Modify: `src/components/monthly/inline-edit-field.tsx`
  - Align inline edit rows with the redesigned control treatment.

### Setup and fallback states

- Modify: `src/app/setup/[year]/page.tsx`
  - Apply the new onboarding/setup presentation and more intentional form framing.
- Modify: `src/app/[year]/overview/page.tsx`
  - Update page header framing to match the shell and overview design.
- Modify: `src/app/[year]/summary/page.tsx`
  - Update page header framing to match the annual summary design.
- Modify: `src/app/[year]/[month]/page.tsx`
  - Update page header framing and the no-data fallback card.

## Task 1: Establish the shared visual system

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Read the relevant Next.js font/layout guidance before touching code**

Run:

```bash
sed -n '1,220p' node_modules/next/dist/docs/app/api-reference/components/font.mdx
```

Expected: documentation for the current installed Next.js version describing `next/font` usage and layout integration.

- [ ] **Step 2: Create a failing baseline by running lint before any styling changes**

Run:

```bash
npm run lint
```

Expected: PASS on the current branch. If it fails, stop and record the existing failure before making changes.

- [ ] **Step 3: Replace the neutral root tokens in `src/app/globals.css` with the approved palette and depth system**

Use this as the target shape for the updated theme block:

```css
:root {
  --background: #f6f8fc;
  --foreground: #273951;
  --card: #ffffff;
  --card-foreground: #061b31;
  --popover: #ffffff;
  --popover-foreground: #061b31;
  --primary: #533afd;
  --primary-foreground: #ffffff;
  --secondary: #eef2fb;
  --secondary-foreground: #061b31;
  --muted: #f2f5fb;
  --muted-foreground: #64748d;
  --accent: #eef1ff;
  --accent-foreground: #2e2b8c;
  --destructive: #ea2261;
  --border: #e5edf5;
  --input: #d6e0f0;
  --ring: #665efd;
  --chart-1: #533afd;
  --chart-2: #7a6cff;
  --chart-3: #061b31;
  --chart-4: #15be53;
  --chart-5: #ea2261;
  --radius: 0.5rem;
  --shadow-ambient: 0 15px 35px rgba(23, 23, 23, 0.08);
  --shadow-elevated: 0 30px 45px -30px rgba(50, 50, 93, 0.25), 0 18px 36px -18px rgba(0, 0, 0, 0.1);
  --surface-tint: linear-gradient(180deg, rgba(83, 58, 253, 0.06), rgba(255, 255, 255, 0));
}
```

- [ ] **Step 4: Add global typography, page background, and finance-number utilities in `src/app/globals.css`**

Use this as the target shape for the new base layer additions:

```css
@layer base {
  html {
    @apply font-sans;
  }

  body {
    background:
      radial-gradient(circle at top left, rgba(249, 107, 238, 0.12), transparent 24rem),
      linear-gradient(180deg, #fbfcff 0%, #f6f8fc 50%, #f3f6fb 100%);
    color: var(--foreground);
  }

  h1,
  h2,
  h3,
  h4 {
    color: var(--card-foreground);
    letter-spacing: -0.03em;
  }
}

@utility text-balance-data {
  color: var(--card-foreground);
  font-variant-numeric: tabular-nums;
  font-feature-settings: "tnum" 1;
}

@utility surface-panel {
  background: var(--card);
  box-shadow: var(--shadow-ambient);
}

@utility surface-featured {
  background: linear-gradient(180deg, rgba(255,255,255,0.98), rgba(244,247,255,0.98));
  box-shadow: var(--shadow-elevated);
}
```

- [ ] **Step 5: Update `src/app/layout.tsx` metadata and root markup to support the redesign**

Use this shape for the key layout adjustments:

```tsx
export const metadata: Metadata = {
  title: "Gridly",
  description: "Control financiero personal anual y mensual",
};

<html
  lang="es"
  className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
  suppressHydrationWarning
>
  <body className="min-h-full bg-background text-foreground">
    {children}
  </body>
</html>
```

- [ ] **Step 6: Run lint after the shared token pass**

Run:

```bash
npm run lint
```

Expected: PASS.

- [ ] **Step 7: Commit the shared token pass**

Run:

```bash
git add src/app/globals.css src/app/layout.tsx
git commit -m "feat: add Gridly visual system tokens"
```

Expected: a commit containing only the global styling and root metadata updates.

## Task 2: Restyle the shared UI primitives

**Files:**
- Modify: `src/components/ui/button.tsx`
- Modify: `src/components/ui/input.tsx`
- Modify: `src/components/ui/card.tsx`
- Modify: `src/components/ui/select.tsx`

- [ ] **Step 1: Run lint to confirm the token pass is clean before changing primitives**

Run:

```bash
npm run lint
```

Expected: PASS.

- [ ] **Step 2: Update `src/components/ui/card.tsx` to use tighter radii, cooler rings, and premium spacing**

Use this shape for the primary card classes:

```tsx
className={cn(
  "group/card flex flex-col gap-4 overflow-hidden rounded-lg border border-border/80 bg-card text-sm text-card-foreground shadow-[var(--shadow-ambient)]",
  "supports-[backdrop-filter]:bg-white/92",
  "data-[size=sm]:gap-3",
  className
)}
```

Update `CardHeader`, `CardTitle`, and `CardContent` to favor tighter spacing and slightly calmer default text sizes:

```tsx
className={cn("grid auto-rows-min items-start gap-1.5 px-5 pt-5", className)}
```

```tsx
className={cn("font-heading text-[1.05rem] leading-tight font-medium tracking-[-0.02em]", className)}
```

- [ ] **Step 3: Update `src/components/ui/button.tsx` variants to align with the design system**

Use these target variant patterns:

```tsx
default: "bg-primary text-primary-foreground shadow-[0_12px_24px_-12px_rgba(83,58,253,0.9)] hover:bg-[#4434d4]"
```

```tsx
outline: "border-border bg-white/80 text-[#273951] hover:border-[#b9b9f9] hover:bg-[#f7f8ff]"
```

```tsx
ghost: "text-[#533afd] hover:bg-[#eef1ff] hover:text-[#2e2b8c]"
```

Also tighten sizes so the default button reads more like a compact dashboard control than a generic app button.

- [ ] **Step 4: Update `src/components/ui/input.tsx` so finance fields have clearer borders and focus treatment**

Use this target shape:

```tsx
className={cn(
  "h-9 w-full rounded-md border border-[#d6e0f0] bg-white/90 px-3 text-sm text-[#061b31] shadow-none",
  "placeholder:text-[#7c8ca5] focus-visible:border-[#665efd] focus-visible:ring-3 focus-visible:ring-[#665efd]/15",
  className
)}
```

- [ ] **Step 5: If `src/components/ui/select.tsx` is used for shared selects, align it with the same border/ring/surface system**

Use this target pattern for trigger styling:

```tsx
"h-9 rounded-md border border-[#d6e0f0] bg-white/90 text-sm text-[#061b31] shadow-none focus-visible:border-[#665efd] focus-visible:ring-3 focus-visible:ring-[#665efd]/15"
```

If the component is not used anywhere yet, do not introduce new behavior just to satisfy this task.

- [ ] **Step 6: Run lint after the primitive pass**

Run:

```bash
npm run lint
```

Expected: PASS.

- [ ] **Step 7: Commit the primitive restyle**

Run:

```bash
git add src/components/ui/card.tsx src/components/ui/button.tsx src/components/ui/input.tsx src/components/ui/select.tsx
git commit -m "feat: restyle shared finance UI primitives"
```

Expected: a commit containing only shared primitive updates.

## Task 3: Redesign the shell and navigation

**Files:**
- Modify: `src/components/layout/app-shell.tsx`
- Modify: `src/components/layout/nav-selectors.tsx`
- Modify: `src/app/[year]/overview/page.tsx`
- Modify: `src/app/[year]/summary/page.tsx`
- Modify: `src/app/[year]/[month]/page.tsx`

- [ ] **Step 1: Run lint before the shell pass**

Run:

```bash
npm run lint
```

Expected: PASS.

- [ ] **Step 2: Recompose `src/components/layout/app-shell.tsx` into a premium dashboard frame**

Use this target structure:

```tsx
<div className="min-h-screen bg-transparent">
  <header className="sticky top-0 z-20 border-b border-white/60 bg-white/75 backdrop-blur-xl">
    <div className="mx-auto flex w-full max-w-[1080px] flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Link href="/" className="flex items-center gap-3">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-[linear-gradient(135deg,#533afd,#8b7bff)] text-sm font-semibold text-white shadow-[0_18px_30px_-18px_rgba(83,58,253,0.9)]">
            G
          </span>
          <div>
            <p className="text-[0.72rem] uppercase tracking-[0.18em] text-muted-foreground">Gridly</p>
            <p className="text-sm text-[#061b31]">Control anual y mensual</p>
          </div>
        </Link>
        <NavSelectors currentYear={currentYear} currentMonth={currentMonth} view={view} years={years} />
      </div>
    </div>
  </header>
  <main className="mx-auto flex w-full max-w-[1080px] flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
    {children}
  </main>
</div>
```

- [ ] **Step 3: Replace the raw navigation styling in `src/components/layout/nav-selectors.tsx`**

Keep the routing behavior intact, but move the year selector and tab links toward this shape:

```tsx
<div className="flex flex-col gap-3">
  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
    <div className="inline-flex items-center rounded-md border border-border bg-white/90 px-3 shadow-[var(--shadow-ambient)]">
      <select className="h-9 bg-transparent pr-8 text-sm text-[#061b31] outline-none">
```

And for the tabs:

```tsx
className={cn(
  "rounded-md px-3 py-2 text-[0.8rem] transition-colors",
  active ? "bg-[#533afd] text-white shadow-[0_14px_24px_-14px_rgba(83,58,253,0.9)]" : "text-[#5f6f89] hover:bg-white hover:text-[#061b31]"
)}
```

- [ ] **Step 4: Update the page-level headers in `src/app/[year]/overview/page.tsx`, `src/app/[year]/summary/page.tsx`, and `src/app/[year]/[month]/page.tsx`**

Use this target header wrapper shape:

```tsx
<div className="flex flex-col gap-2">
  <p className="text-[0.72rem] uppercase tracking-[0.18em] text-muted-foreground">Vista actual</p>
  <h1 className="text-3xl font-medium tracking-[-0.04em] text-[#061b31]">
    {MONTH_NAMES[currentMonth - 1]} {year}
  </h1>
</div>
```

Adapt the label text per route so the summary page and monthly detail page each have distinct, Spanish-language eyebrow copy.

- [ ] **Step 5: Restyle the no-data fallback in `src/app/[year]/[month]/page.tsx`**

Keep the existing behavior, but use a featured surface rather than a plain centered text stack:

```tsx
<div className="min-h-screen px-4 py-10">
  <div className="mx-auto max-w-xl rounded-xl border border-border bg-white/95 p-8 shadow-[var(--shadow-elevated)]">
```

- [ ] **Step 6: Run lint after the shell/navigation pass**

Run:

```bash
npm run lint
```

Expected: PASS.

- [ ] **Step 7: Commit the shell/navigation pass**

Run:

```bash
git add src/components/layout/app-shell.tsx src/components/layout/nav-selectors.tsx 'src/app/[year]/overview/page.tsx' 'src/app/[year]/summary/page.tsx' 'src/app/[year]/[month]/page.tsx'
git commit -m "feat: redesign Gridly shell and navigation"
```

Expected: a commit containing only shell and page-header composition updates.

## Task 4: Recompose overview and annual summary surfaces

**Files:**
- Modify: `src/components/monthly/month-overview.tsx`
- Modify: `src/components/annual/annual-view.tsx`
- Modify: `src/components/annual/kpi-cards.tsx`
- Modify: `src/components/annual/year-config-form.tsx`
- Modify: `src/components/annual/balance-chart.tsx`
- Modify: `src/components/annual/savings-chart.tsx`

- [ ] **Step 1: Run lint before route-surface changes**

Run:

```bash
npm run lint
```

Expected: PASS.

- [ ] **Step 2: Turn `src/components/monthly/month-overview.tsx` into the current-month cockpit**

Preserve the existing data and add/delete handlers, but restructure the markup toward:

```tsx
<div className="space-y-6">
  <section className="rounded-xl border border-[#dfe6f4] bg-[linear-gradient(135deg,rgba(83,58,253,0.08),rgba(255,255,255,0.96))] p-5 shadow-[var(--shadow-elevated)]">
    <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
```

Keep the three KPI cards, but make labels quieter and values use the new tabular utility class:

```tsx
<p className="text-[0.72rem] uppercase tracking-[0.16em] text-muted-foreground">Ingresos</p>
<p className="text-balance-data text-2xl font-medium text-emerald-600">{formatCurrency(month.totalIncome)}</p>
```

- [ ] **Step 3: Refine the quick-add cards in `src/components/monthly/month-overview.tsx` without changing behavior**

Use paired cards with clearer empty states and calmer action links:

```tsx
<button className="inline-flex items-center gap-1 text-xs text-[#533afd] hover:text-[#2e2b8c]">
  <Plus className="h-3 w-3" />
  Añadir gasto
</button>
```

When the list is empty, show a purpose-driven state like:

```tsx
<p className="rounded-md border border-dashed border-[#c8d2e6] bg-[#f8faff] px-3 py-3 text-xs text-muted-foreground">
  No hay movimientos extra este mes.
</p>
```

- [ ] **Step 4: Recompose `src/components/annual/annual-view.tsx` into a stronger summary page**

Keep the handlers intact, but move the top of the page toward:

```tsx
<div className="space-y-8">
  <section className="rounded-xl border border-[#d7def0] bg-[radial-gradient(circle_at_top_left,rgba(249,107,238,0.16),transparent_28%),linear-gradient(135deg,#1c1e54,#0d253d)] p-6 text-white shadow-[var(--shadow-elevated)]">
```

Place the action buttons inside this section and make one of them the primary call to action while keeping destructive or overwrite semantics clear.

- [ ] **Step 5: Update `src/components/annual/kpi-cards.tsx` and `src/components/annual/year-config-form.tsx`**

Make KPI cards more editorial:

```tsx
<Card className="border-white/60 bg-white/92">
  <CardHeader className="pb-2">
    <CardTitle className="text-[0.72rem] uppercase tracking-[0.16em] text-muted-foreground">{k.label}</CardTitle>
  </CardHeader>
```

And make the config form feel like a control panel by adding section intro copy and cleaner row spacing:

```tsx
<CardHeader className="gap-2">
  <CardTitle>Configuración del año</CardTitle>
  <p className="text-sm text-muted-foreground">Ajusta las hipótesis base que alimentan el prefill y el seguimiento anual.</p>
</CardHeader>
```

- [ ] **Step 6: Restyle chart containers in `src/components/annual/balance-chart.tsx` and `src/components/annual/savings-chart.tsx`**

Do not change chart data logic. Limit changes to container framing, axis text color, gridline subtlety, and tooltip/card chrome. Aim for:

```tsx
stroke="#cfd8e8"
tick={{ fill: "#64748d", fontSize: 12 }}
```

and a chart wrapper with:

```tsx
className="rounded-xl border border-border bg-white/92 p-4 shadow-[var(--shadow-ambient)]"
```

- [ ] **Step 7: Run lint after the overview/annual pass**

Run:

```bash
npm run lint
```

Expected: PASS.

- [ ] **Step 8: Commit the overview/annual pass**

Run:

```bash
git add src/components/monthly/month-overview.tsx src/components/annual/annual-view.tsx src/components/annual/kpi-cards.tsx src/components/annual/year-config-form.tsx src/components/annual/balance-chart.tsx src/components/annual/savings-chart.tsx
git commit -m "feat: redesign Gridly overview and annual summary"
```

Expected: a commit containing only overview and annual summary surface changes.

## Task 5: Recompose monthly detail editing surfaces

**Files:**
- Modify: `src/components/monthly/monthly-view.tsx`
- Modify: `src/components/monthly/fixed-expenses-card.tsx`
- Modify: `src/components/monthly/income-card.tsx`
- Modify: `src/components/monthly/additional-entries-card.tsx`
- Modify: `src/components/monthly/summary-card.tsx`
- Modify: `src/components/monthly/inline-edit-field.tsx`

- [ ] **Step 1: Run lint before the monthly-detail pass**

Run:

```bash
npm run lint
```

Expected: PASS.

- [ ] **Step 2: Refine the top-level composition in `src/components/monthly/monthly-view.tsx`**

Keep the current three-column logic, but make the page rhythm less flat:

```tsx
<div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_360px]">
```

Give the summary column a sticky large-screen treatment if it does not create overlap issues:

```tsx
<div className="md:col-span-2 xl:col-span-1 xl:sticky xl:top-28 xl:self-start">
```

- [ ] **Step 3: Restyle `src/components/monthly/fixed-expenses-card.tsx` and `src/components/monthly/income-card.tsx`**

Keep the row list behavior but strengthen the framing:

```tsx
<CardHeader className="pb-3">
  <CardTitle className="text-sm tracking-[-0.02em]">Gastos fijos</CardTitle>
</CardHeader>
<CardContent className="divide-y divide-[#edf1f7]">
```

Use the same pattern for income so both cards read as one family.

- [ ] **Step 4: Update `src/components/monthly/summary-card.tsx` to anchor the page**

Use a featured surface and stronger visual separation for the closing balance:

```tsx
<Card className="border-[#d7def0] bg-[linear-gradient(180deg,#ffffff,rgba(244,247,255,0.96))] shadow-[var(--shadow-elevated)]">
```

And make the final row feel conclusive:

```tsx
<div className="mt-3 rounded-lg bg-[#eef1ff] px-3 py-3">
  <SummaryRow label="Saldo final" value={month.endingBalance} highlight />
</div>
```

- [ ] **Step 5: Improve add/edit/delete clarity in `src/components/monthly/additional-entries-card.tsx` and `src/components/monthly/inline-edit-field.tsx`**

Keep all handlers intact. Focus only on row density, value alignment, edit affordance clarity, and empty states. Use patterns like:

```tsx
<button className="text-sm text-left text-[#061b31] transition-colors hover:text-[#533afd]">
```

```tsx
<span className="text-balance-data text-sm font-medium text-[#061b31]">{formatCurrency(entry.amount)}</span>
```

For inline edit rows, prefer a two-column label/value treatment:

```tsx
<div className="flex items-center justify-between gap-4 py-3">
  <span className="text-sm text-muted-foreground">{label}</span>
```

- [ ] **Step 6: Run lint after the monthly-detail pass**

Run:

```bash
npm run lint
```

Expected: PASS.

- [ ] **Step 7: Commit the monthly-detail pass**

Run:

```bash
git add src/components/monthly/monthly-view.tsx src/components/monthly/fixed-expenses-card.tsx src/components/monthly/income-card.tsx src/components/monthly/additional-entries-card.tsx src/components/monthly/summary-card.tsx src/components/monthly/inline-edit-field.tsx
git commit -m "feat: redesign Gridly monthly detail surfaces"
```

Expected: a commit containing only monthly editing surface updates.

## Task 6: Redesign setup and fallback states, then verify end-to-end

**Files:**
- Modify: `src/app/setup/[year]/page.tsx`
- Modify: `src/app/[year]/[month]/page.tsx`

- [ ] **Step 1: Run lint before the final state pass**

Run:

```bash
npm run lint
```

Expected: PASS.

- [ ] **Step 2: Reframe `src/app/setup/[year]/page.tsx` as a designed onboarding card**

Keep the form behavior intact, but move the page toward this structure:

```tsx
<div className="min-h-screen px-4 py-10">
  <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1.1fr_0.9fr]">
    <section className="rounded-xl border border-[#d7def0] bg-[linear-gradient(135deg,#1c1e54,#0d253d)] p-8 text-white shadow-[var(--shadow-elevated)]">
```

Use the second column for the form card:

```tsx
<Card className="border-white/70 bg-white/95 shadow-[var(--shadow-elevated)]">
```

- [ ] **Step 3: Make the setup form inputs and errors feel consistent with the system**

Preserve the same `FIELDS` data and submit behavior, but update label rhythm and error copy treatment:

```tsx
<label className="text-sm font-medium text-[#273951]">{f.label}</label>
```

```tsx
{error && <p className="rounded-md border border-[#ffd7ef] bg-[#fff4fa] px-3 py-2 text-sm text-[#b42361]">{error}</p>}
```

- [ ] **Step 4: Run full verification**

Run:

```bash
npm run lint
npm run build
```

Expected:

- `eslint` exits successfully
- `next build` completes successfully for Next.js `16.2.2`

- [ ] **Step 5: Perform manual route verification**

Run:

```bash
npm run dev
```

Then verify all of the following in a browser:

- `/<current-year>/overview`
- `/<current-year>/summary`
- `/<current-year>/1` and one month with extra pay such as `/<current-year>/6`
- `/setup/<next-year>`
- no-data monthly fallback by navigating to a year that has not been created

Expected:

- headers, cards, and controls share one visual language
- overview feels like the current-month cockpit
- annual summary contains the strongest brand moment without reducing chart legibility
- monthly summary card anchors the page on large screens
- inline edit, add, and delete actions remain clear and fast
- setup and no-data states feel intentional rather than default

- [ ] **Step 6: Commit the setup/fallback and verification pass**

Run:

```bash
git add 'src/app/setup/[year]/page.tsx' 'src/app/[year]/[month]/page.tsx'
git commit -m "feat: redesign Gridly setup and fallback states"
```

Expected: a final implementation commit after verification passes.

## Self-Review

- Spec coverage:
  - shared visual system is covered by Tasks 1-2
  - app shell and navigation are covered by Task 3
  - overview cockpit treatment and annual brand moment are covered by Task 4
  - monthly detail hierarchy and editing surfaces are covered by Task 5
  - setup and missing-data states are covered by Task 6
  - lint/build/manual verification are covered by Tasks 1-6
- Placeholder scan:
  - no `TODO`, `TBD`, or “similar to above” references remain
  - each task names exact files and commands
- Type consistency:
  - all referenced components and files match the current codebase names
  - no new routes, APIs, or data contracts are introduced

