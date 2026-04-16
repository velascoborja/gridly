# Gridly Design Application

Date: 2026-04-16
Status: Approved in conversation, pending final user review of written spec

## Goal

Apply the visual direction from `DESIGN.md` across the full Gridly product as a loose inspiration rather than a literal Stripe clone.

The redesign should:

- cover the whole product, not only the shell
- stay mostly light, with a few stronger brand moments
- preserve current workflows, data models, routing, and finance logic
- improve hierarchy, polish, and trust without reducing editing speed

The redesign should not:

- introduce a new component library
- depend on proprietary fonts or a large new font pipeline
- rewrite data flow or API behavior
- alter core budgeting or month-chain logic

## Product Context

Gridly is a Spanish-language personal finance tracker built with Next.js 16, React 19, Tailwind CSS v4, shadcn/ui, Drizzle, and Neon.

The current product already has a solid structural split:

- shell and navigation via `AppShell` and selector controls
- annual summary surfaces via `AnnualView`, KPI cards, charts, and year config
- current-month overview via `MonthOverview`
- monthly editing workflow via fixed expenses, fixed income, additional entries, and monthly summary cards

This redesign will use that structure rather than inventing a new app architecture.

## Design Direction

### Interpretation of `DESIGN.md`

The target is a premium fintech dashboard with:

- light, precise surfaces
- deep navy text instead of pure black
- violet as the primary interactive accent
- cool, layered shadows rather than neutral gray elevation
- restrained radii and dense-but-clear spacing
- strong tabular treatment for financial values
- selective dark or gradient-backed sections used as brand moments

Because the brief is being applied loosely, the implementation should capture the mood and hierarchy rather than attempt exact visual replication of Stripe.

### Experience Principles

- Finance-first clarity: money values remain the most legible elements on the page.
- Premium restraint: polish should come from spacing, hierarchy, color temperature, and depth more than decoration.
- Fast editing: inline edits and quick-add flows must remain immediate and low-friction.
- Consistent tone: empty, loading, and missing-data states should feel designed, not like defaults.
- Balanced expression: the app remains mostly light, with a limited number of stronger visual moments.

## Scope

This pass covers the full visible product:

- app shell and navigation
- overview page
- annual summary page
- monthly detail page
- setup and missing-data states
- shared UI primitives used by those screens

This pass does not include:

- domain logic changes
- new analytics or charts
- new workflows
- localization rewrites
- dark mode as a primary deliverable

## Proposed Approach

Recommended approach: hybrid.

Implementation should proceed in two layers:

1. establish the shared visual system
2. perform targeted composition passes on the main screens

This is preferred over a pure screen-first redesign because Gridly already relies on shared shadcn/Tailwind primitives. It is also preferred over a pure token swap because the main screens need layout and hierarchy changes to feel intentional.

## Visual System

### Color Roles

Define a light dashboard palette inspired by the brief:

- background: soft white or near-white canvas
- text heading: deep navy
- text body: cool slate-blue neutrals
- primary action: saturated violet
- borders: pale blue-gray and soft violet-tinted variants
- positive values: clear but restrained green
- negative values: clear but restrained red
- accent surfaces: optional magenta/ruby-tinted moments used sparingly

Pure black should be avoided for primary headings and dense UI text. Decorative accent colors should not replace violet as the main interactive color.

### Typography

Use the existing stack or an accessible local/open substitute that fits the product, rather than trying to source proprietary fonts.

Typography goals:

- stronger, lighter-feeling headline hierarchy
- cooler, more premium text color
- tighter display spacing where appropriate
- consistent tabular numeral styling for all key monetary values
- clearer separation between labels, supporting copy, and financial figures

The product must remain fully Spanish in all user-facing copy.

### Elevation and Surfaces

Adopt cooler, layered shadows and more deliberate surface treatment:

- default cards: low-to-medium cool shadow
- featured cards and floating elements: layered blue-tinted elevation
- radii: conservative, mostly in the 4px-8px range
- borders: subtle and cool-toned, with occasional accent-tinted variants for emphasis

Shadows should reinforce depth without making the interface soft or rounded like a consumer banking app.

### Controls

Buttons, inputs, selects, and inline edit affordances should be restyled to feel like part of one system:

- clearer default, hover, active, and disabled states
- stronger focus rings for keyboard accessibility
- tighter visual rhythm between label, field, and value
- improved contrast and consistency for small controls

The interaction behavior should remain familiar to current users.

## Screen Design

### App Shell

`AppShell` becomes the anchor for the design system.

It should provide:

- a sticky translucent header
- refined brand treatment for the Gridly wordmark
- more polished selector controls
- a more deliberate content canvas and section spacing

The shell should signal a premium dashboard without taking attention away from the data surfaces beneath it.

### Overview Page

The overview page should be reframed as the current-month cockpit.

Key treatment:

- compact but high-quality page header
- subtle summary band or intro block for month balance movement
- stronger KPI cards with better numeric emphasis
- paired quick-add cards for additional income and expense, with clearer empty/add states
- improved balance transition block for saldo inicial to saldo final

This page should feel immediately actionable and easy to scan.

### Annual Summary Page

This page should be the strongest brand moment in the app.

Key treatment:

- elevated KPI row with clearer hierarchy
- more editorial framing for the chart section
- improved action area for export and prefill
- year configuration styled as a serious financial control panel rather than a plain list
- one restrained dark or gradient-supported section, likely in the summary header or chart region

The stronger visual moment should remain secondary to the financial content.

### Monthly Detail Page

Keep the current three-area mental model:

- fixed expenses
- fixed income
- monthly summary

Refine the page through:

- better column rhythm and card hierarchy
- a more visually prominent summary card
- more consistent editable row styling
- clearer value alignment and hover/focus states
- tighter cohesion between fixed-entry and additional-entry cards

The monthly detail page should still feel fast and operational, not decorative.

### Setup and Missing-Data States

Fallback states must be intentionally designed.

This includes:

- no-data states
- create-year flow entry points
- empty additional-entry lists
- loading and saving states

These states should use the same visual language as the main app rather than fallback defaults.

## Behavior and Boundaries

### Interaction Model

Keep the current interaction model intact:

- no route changes
- no workflow redesign
- no data model changes
- no API contract changes

Allowed UX refinements:

- clearer disabled/loading states
- better empty-state messaging
- improved keyboard focus treatment
- more consistent affordances for inline editing and quick-add interactions

### Data and Domain Constraints

The redesign must preserve existing finance behavior, including:

- extra pay handling
- month-chain computation
- Spanish employment conventions
- numeric conversion rules between DB and TypeScript

This project is finance-oriented, so styling changes must never obscure sign, magnitude, or interpretation of monetary values.

## Implementation Shape

Expected implementation areas:

- `src/app/globals.css` for shared tokens, typography, shadows, radii, and number styling
- shared UI primitives in `src/components/ui/`
- shell components in `src/components/layout/`
- overview, annual, and monthly view components for composition changes
- setup and missing-data states where they currently fall back to more generic layouts

The implementation should stay compatible with Tailwind CSS v4 and the existing shadcn/ui structure.

## Error Handling and Edge States

All states should match the same system:

- loading actions should show clear disabled or pending affordances
- missing data should route into designed fallback surfaces
- empty entry lists should feel intentional
- confirm and destructive flows should remain legible and unambiguous

Decorative styling must not interfere with comprehension of saving, deleting, or overwrite actions.

## Verification

Verification should remain pragmatic and evidence-based:

- run lint
- run build
- visually inspect overview, annual summary, month detail, and setup-related states
- confirm responsive behavior on desktop and mobile widths
- confirm editable finance rows remain readable and usable

If any styling change makes values harder to parse or inline editing slower to use, that is a regression.

## Risks

- Over-indexing on aesthetic similarity to Stripe could damage usability in a data-entry workflow.
- A token-only pass may leave key screens visually under-designed.
- A screen-only pass may create inconsistency across shared controls.
- Stronger brand moments could reduce legibility if applied directly to editable data surfaces.

The implementation should mitigate these by keeping decorative treatments mostly around headers, wrappers, or summary regions.

## Success Criteria

The redesign is successful if:

- the app feels substantially more premium and cohesive
- the product remains mostly light with a few stronger brand moments
- financial values are more legible, not less
- overview, summary, and monthly detail all feel like parts of one system
- shared controls look intentional and consistent
- no finance logic or editing workflow is destabilized

