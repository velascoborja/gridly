# Landing Page Redesign Design

## Goal

Redesign Gridly's public landing page so it feels premium, focused, and product-specific while preserving the current functional surface:

- localized Spanish and English copy through `messages/es.json` and `messages/en.json`
- Gridly wordmark
- demo CTA
- Google sign-in CTA
- account-deleted and auth-error notices
- current feature proof for monthly control, chained balances, annual summary, and export
- synthetic product preview with finance data

The redesign should remove vague phrasing and replace it with copy that explains Gridly as a personal finance year planner for income, expenses, savings, extra pays, and year-to-year balance continuity.

## Direction

Use an A+B hybrid:

- A: a concrete two-column product hero with sharp copy on the left and a realistic Gridly dashboard preview on the right.
- B: an annual story section below the hero that uses a compact chart rhythm to show the full-year view.

The page should not become a generic marketing site. The first viewport should immediately signal "Gridly is a finance tracker" through product UI, financial numbers, month/year labels, and the two primary actions.

## Visual System

Follow `DESIGN.md` as the source of truth:

- white and near-white surfaces
- deep navy headings (`#061b31`)
- Stripe purple (`#533afd`) for primary actions and active data
- conservative radii from 4px to 8px for new primary UI surfaces
- blue-tinted multi-layer shadows for elevated previews
- light-weight headings and tight display tracking
- tabular numerals for all synthetic financial amounts

Avoid the current oversized rounded-card look on the landing page. The visual feel should be crisp fintech, not soft SaaS. Decorative gradients may be used sparingly as atmosphere, but the product preview and annual chart should carry the page.

## Page Structure

### Header

Keep the existing wordmark and actions:

- left: Gridly wordmark and development badge when applicable
- right: demo CTA and Google sign-in

Refine spacing, blur, and elevation so it reads as a compact navigation bar. On mobile, stack or wrap actions without crowding.

### Hero

Use a two-column layout on desktop and a single-column layout on mobile.

Left side:

- short eyebrow or product label
- specific H1 focused on planning the financial year, not generic "vision"
- concise paragraph explaining income, expenses, savings, monthly chaining, and annual view
- demo and sign-in actions
- three compact proof metrics or capability chips

Right side:

- realistic product preview with annual KPIs and current-month detail
- synthetic values only; no real user data
- clear labels for annual balance, monthly savings, extra pays, income, expenses, and ending balance
- tighter 4px-8px radii and blue-tinted elevation

### Annual Story Section

Add a second section below the hero that introduces the full-year view:

- heading focused on how each month connects to the annual close
- short supporting text
- compact 12-month chart or bar visualization using synthetic values
- a few month markers, including June and December extra-pay emphasis

This section should borrow the centered/chart confidence from option B without replacing the concrete hero preview.

### Feature Proof

Replace the current three large feature cards with a more precise proof row or compact feature grid:

- Monthly control: income, fixed expenses, additional entries
- Balance chain: starting balance, ending balance, next-month continuity
- Annual close: summary charts and Excel export

Feature copy should be shorter and more concrete than the current descriptions.

### Notices

Preserve existing account-deleted and auth-error notices above the hero content. Restyle them to match the new tighter visual system, but do not change behavior.

## Copy Strategy

Spanish is primary. English should be a faithful localized version, not a literal awkward translation.

Recommended Spanish copy direction:

- H1: "Planifica tu año financiero mes a mes."
- Body: "Gridly une ingresos, gastos, ahorro y saldo inicial en una cadena anual clara, con pagas extra, resumen del ejercicio y exportación a Excel."
- Feature titles: "Mes a mes", "Saldo conectado", "Cierre anual"

Recommended English copy direction:

- H1: "Plan your financial year month by month."
- Body: "Gridly connects income, expenses, savings, and starting balance into a clear annual chain, with extra pay periods, year summary, and Excel export."
- Feature titles: "Month by month", "Connected balance", "Annual close"

All strings must remain in `messages/es.json` and `messages/en.json`.

## Implementation Boundaries

Primary files expected to change:

- `src/components/landing/public-hero.tsx`
- `messages/es.json`
- `messages/en.json`

Possible supporting change:

- `src/app/globals.css` only if a reusable landing utility is cleaner than long repeated Tailwind classes.

Do not change routing, auth behavior, demo href generation, or signed-in redirect logic.

## Responsiveness

Desktop:

- max-width close to the current content container
- hero uses two columns with preview visible in the first viewport
- annual chart section appears just below the fold or with a visible hint

Mobile:

- header actions remain usable
- hero copy appears before preview
- preview compresses without horizontal overflow
- chart section becomes horizontally compact or stacked, not scroll-dependent unless unavoidable

## Verification

Run:

- `npm run lint`
- `npm run build` if the change touches shared rendering or reveals type issues

Visually check:

- desktop landing page
- mobile landing page
- Spanish and English strings
- account-deleted notice
- auth-error notice
- demo CTA and Google sign-in still render

## Open Decisions Resolved

- Use A+B hybrid as the approved direction.
- Keep the page product-led rather than editorial-only.
- Keep current features and behavior; redesign presentation and copy only.
- Do not use the dark C direction as the primary page foundation.
