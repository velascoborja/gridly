# Current Month Header Redesign

## Goal

Improve the header in the "current month" view so the user can understand the monthly outcome immediately. The header should prioritize `Ahorro del mes` and `Saldo final`, while still exposing the rest of the month data without giving it equal visual weight.

## Scope

This change applies only to the hero header card rendered by `MonthOverview` in `src/components/monthly/month-overview.tsx`.

In scope:
- Rework the header information hierarchy
- Adjust typography, spacing, grouping, and emphasis
- Keep all existing month metrics visible
- Preserve responsive behavior for mobile and desktop

Out of scope:
- Changes to calculation logic
- Changes to the `Resumen del mes` card
- Changes to data fetching or persistence
- New interactions or controls

## Problem Statement

The current header presents `Saldo inicial`, `Saldo final`, `Ahorro`, `Ingresos`, and `Gastos` as similarly weighted summary tiles. That makes the monthly outcome harder to parse because the most important figures do not stand out enough from the supporting context.

For this screen, the user’s primary question is not "what are all the monthly numbers?" but "how did this month end?" The header should answer that immediately.

## Recommended Approach

Adopt a hero-style header with a strict two-level hierarchy:

1. Primary outcome: `Ahorro del mes`
2. Secondary outcome: `Saldo final`
3. Supporting context: `Saldo inicial`, `Ingresos`, and `Gastos`

This fits the page better than a KPI strip because the rest of the screen already contains detailed cards. The header should therefore behave like an executive summary, not like another dashboard row.

## Information Architecture

### Top Bar

Keep a restrained identity layer containing:
- `Mes activo` pill
- Month name

This section remains present but visually quiet.

### Hero Outcome Area

The main body of the header should promote the two key figures:

- `Ahorro del mes` becomes the dominant metric on the card
- `Saldo final` becomes the second most prominent metric

`Ahorro del mes` should be larger, earlier in reading order, and use semantic color:
- Positive: green-tinted value
- Negative: red-tinted value

`Saldo final` should remain prominent through size, spacing, and position rather than aggressive accent color. It should feel stable and important, not status-coded.

### Supporting Metrics Band

Move the remaining values into a compact, lower-priority area:
- `Saldo inicial`
- `Ingresos`
- `Gastos`

This band should read as contextual support for the outcome rather than as peer KPIs. It should use smaller text, lower contrast, and simpler card treatments than the hero figures.

## Layout

### Desktop

Use a two-tier composition inside the existing dark gradient card:

- Top: month identity
- Middle: hero outcome content
- Bottom: supporting metrics row

Within the hero area:
- Place `Ahorro del mes` first and give it the largest numeric treatment
- Place `Saldo final` adjacent or directly below, depending on available width

The supporting metrics row should sit in a separate muted container or divided strip near the bottom edge of the card.

### Mobile

Keep the same hierarchy but stack vertically:
- Month identity
- `Ahorro del mes`
- `Saldo final`
- Supporting metrics grid

The mobile version should not flatten back into equal cards. Priority must remain obvious even when stacked.

## Visual Design Rules

Follow `DESIGN.md` and preserve the existing premium fintech feel:

- Keep the dark gradient hero background
- Keep elevated shadow treatment
- Use tabular numerals for all currency values
- Use stronger type size and spacing to create hierarchy instead of adding more decoration
- Keep rounded corners conservative

Specific emphasis rules:
- `Ahorro del mes`: strongest size and contrast on the card
- `Saldo final`: prominent but visually calmer than `Ahorro del mes`
- Supporting metrics: muted labels and smaller numbers

The explanatory paragraph in the current header should be removed or reduced to a minimal supporting line. The numbers should carry the meaning.

## Copy

Preferred labels:
- `Ahorro del mes`
- `Saldo final`
- `Saldo inicial`
- `Ingresos`
- `Gastos`

Avoid longer descriptive copy unless a very short line is needed for spacing or tone.

## Accessibility

- Maintain sufficient color contrast on the dark surface
- Do not rely on color alone to distinguish importance
- Preserve readable label-to-value pairing on small screens
- Keep semantic ordering aligned with visual ordering

## Testing Strategy

Validation should focus on rendering and hierarchy rather than business logic:

- Confirm the header still renders the correct month values
- Confirm `Ahorro del mes` and `Saldo final` appear before supporting metrics in the DOM and visual flow
- Confirm mobile and desktop layouts preserve the same emphasis order
- Confirm positive and negative savings states render correctly

## Implementation Notes

- Limit changes to the header portion of `MonthOverview`
- Reuse existing utilities such as `formatCurrency` and `MONTH_NAMES`
- Avoid duplicating summary logic already represented elsewhere on the page

## Acceptance Criteria

- The header clearly centers the month around `Ahorro del mes`
- `Saldo final` is immediately visible as the second key result
- `Saldo inicial`, `Ingresos`, and `Gastos` remain present but visibly secondary
- The layout feels intentional on both desktop and mobile
- The visual treatment remains aligned with the project design system
