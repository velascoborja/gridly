# Design: Evolution Dashboard — Total Wealth Hero Metric

**Date:** 2026-05-07
**Status:** Approved

## Summary

Add a prominent hero metric to the Evolution Dashboard header that shows the user's estimated total wealth: current cash balance plus lifetime accumulated investment. This gives users a single headline figure that combines both sides of their financial picture.

## Metric Definition

**Formula:** `totalWealth = latestFinalBalance + accumulatedInvested`

- `latestFinalBalance`: December ending balance of the most recent year
- `accumulatedInvested`: running investment total across all recorded years (already computed in `EvolutionSummary`)

Both values are already available in `EvolutionSummary`. This is a derived field, not a new data-loading concern.

**Label (ES):** Patrimonio total estimado
**Note (ES):** Saldo actual + inversión acumulada
**Label (EN):** Estimated total wealth
**Note (EN):** Current balance + accumulated investment

## Data Layer Changes

**File:** `src/lib/evolution.ts`

Add `totalWealth: number` to the `EvolutionSummary` interface and compute it in `summarizeEvolutionMetrics`:

```ts
totalWealth: (latest?.finalBalance ?? 0) + (latest?.accumulatedInvested ?? 0)
```

No changes to `EvolutionYearMetric` or `deriveEvolutionMetrics`.

## UI Changes

**File:** `src/components/evolution/evolution-dashboard.tsx`

Add a hero stripe element inline in the existing header `<section>`, positioned between the description `<p>` and `<EvolutionKpiCards>`. No new component file — the element is a styled `<div>` with:

- Primary-tinted background and border (consistent with existing header styling)
- Small uppercase label in primary color
- Large `finance-number` value
- Muted note line

The 4 KPI cards, charts, detail table, and all other layout remain unchanged.

## Translations

**`messages/es.json`** — under `Evolution`:
```json
"totalWealth": "Patrimonio total estimado",
"totalWealthNote": "Saldo actual + inversión acumulada"
```

**`messages/en.json`** — under `Evolution`:
```json
"totalWealth": "Estimated total wealth",
"totalWealthNote": "Current balance + accumulated investment"
```

## Out of Scope

- No changes to `EvolutionYearMetric` per-year data
- No changes to charts or detail table
- No tooltip or breakdown of the two components (balance vs invested)
- No historical total-wealth chart
