@AGENTS.md

# Project: Gridly

Personal finance tracker built with Next.js 16 (App Router), React 19, Drizzle ORM, and Neon (serverless PostgreSQL).

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16.2.2 — App Router only, no Pages Router |
| Database | Neon (serverless Postgres) via `@neondatabase/serverless` |
| ORM | Drizzle ORM — schema in `src/db/schema.ts`, client in `src/db/index.ts` |
| UI primitives | shadcn/ui (Tailwind CSS v4 + `class-variance-authority`) |
| Charts | Recharts v3 |
| Export | ExcelJS |
| Styling | Tailwind CSS v4 — **not v3**, syntax and config differ |

## Environment

Single required variable — copy `.env.local.example` to `.env.local`:

```
DATABASE_URL=postgresql://user:pass@host/db
```

## Database

- Schema changes: edit `src/db/schema.ts` then run `npx drizzle-kit push` (no migration files needed for dev).
- Numeric columns are stored as `numeric` (string in JS). Always `String(value)` when inserting, parse with `Number()` or `parseFloat()` when reading.
- `additionalEntries.type` is a plain `text` column constrained to `'income' | 'expense'` by the app, not a DB enum.

## Key domain rules

- Months 6 (June) and 12 (December) automatically get an `additionalPayslip` equal to the estimated salary (Spanish extra pays).
- Savings = totalIncome − totalExpenses. Balance chains month-to-month: each month's `startingBalance` = previous month's `endingBalance`.
- The prefill endpoint (`POST /api/years/[year]/prefill`) overwrites all 12 months with estimates derived from `YearConfig`. It deletes existing `additionalEntries` for those months.

## File structure

```
src/
  app/
    layout.tsx                    # Root layout (Geist font, metadata "Gridly")
    page.tsx                      # Home — year selector
    [year]/
      overview/page.tsx           # Annual overview (charts + KPIs)
      summary/page.tsx            # Year summary
      [month]/page.tsx            # Monthly detail
    setup/[year]/page.tsx         # Year setup form
    api/                          # REST handlers (all route.ts files)
  components/
    layout/                       # AppShell, NavSelectors
    annual/                       # AnnualView, KpiCards, BalanceChart, SavingsChart, YearConfigForm
    monthly/                      # MonthlyView, cards (income, fixed expenses, additional entries, summary), InlineEditField
    ui/                           # shadcn primitives (button, card, input, badge, separator, skeleton, select, dropdown-menu)
  db/
    schema.ts                     # Drizzle table definitions
    index.ts                      # DB client (singleton via Proxy)
  lib/
    types.ts                      # YearConfig, MonthData, AdditionalEntry, YearData
    calculations.ts               # totalIncome, totalExpenses, savings, computeMonthChain, estimatedMonthData
    export.ts                     # Excel export logic
    utils.ts                      # cn() helper
```

## Conventions

- All monetary amounts are `number` in TypeScript / application code. Convert to `string` only at the DB boundary (Drizzle insert) and back to `number` immediately after reading.
- Client components that need data fetch it themselves via `fetch()` to the local API routes. Server components fetch directly from the DB.
- No test suite currently. Manual testing in browser.
- UI strings are in Spanish in some components (the app is for a Spanish-speaking user). Do not translate existing Spanish strings to English.
