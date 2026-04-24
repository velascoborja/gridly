<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Project: Gridly (Buddy)

Personal finance tracker built with Next.js 16 (App Router), React 19, Drizzle ORM, and Neon (serverless PostgreSQL). Gridly is designed for monitoring income, expenses, and savings with Spanish employment conventions (e.g., extra pay periods).

## Core Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16.2.2 (App Router) |
| Language | TypeScript |
| Database | Neon (serverless Postgres) |
| ORM | Drizzle ORM |
| UI | React 19, Tailwind CSS v4, shadcn/ui |
| Charts | Recharts v3 |
| Export | ExcelJS |

## Design & Visual Identity

Gridly follows a premium, fintech-inspired visual system (Stripe-like) documented in `DESIGN.md`.
- **UI Authority:** Treat `DESIGN.md` as the source of truth for any UI, layout, typography, color, spacing, shadow, elevation, and component styling changes. Before modifying the UI, review the relevant sections in `DESIGN.md` and keep new work aligned with that spec.
- **Primary Color:** Stripe Purple (`#533afd`).
- **Typography:** Geist Sans with specific tracking and weight roles.
- **Surfaces:** Layered depth system using ambient and elevated shadows.

## Environment & Setup

- **Environment:** Copy `.env.example` or `.env.local.example` to `.env`. Only `DATABASE_URL` is required.
- **Install:** `npm install`
- **Database Sync:** `npx drizzle-kit push` (schema in `src/db/schema.ts`).
- **Development:** `npm run dev`
- **Build:** `npm run build`
- **Lint:** `npm run lint`

## File Structure

- `src/app/`: App router pages, layouts, and API routes.
- `src/components/`: UI components (`annual/`, `monthly/`, `layout/`, `ui/`).
- `src/db/`: Database schema and client initialization.
- `src/lib/`: Financial calculations, types, and utility functions.

## Domain Rules & Logic

- **Extra Pays:** Months 6 (June) and 12 (December) automatically get an `additionalPayslip` equal to the `estimatedSalary`.
- **Month Chain:** Savings = totalIncome - totalExpenses. Each month's `startingBalance` = previous month's `endingBalance`.
- **Data Initialization:** The prefill endpoint (`POST /api/years/[year]/prefill`) overwrites all 12 months based on `YearConfig`.
- **Currency:** Amounts are `number` in TS, `numeric` (string) in DB. Defaults to `es-ES` (Euro).

## Development Conventions

- **Localization:** UI strings are in Spanish. **Do not translate to English.**
- **Data Access:** Client components use `fetch()` to internal APIs; server components use Drizzle directly.
- **Styling:** Adhere to Tailwind CSS v4 and the visual tokens defined in `src/app/globals.css`. For any UI modification, consult `DESIGN.md` first and follow its rules for spacing, elevation, typography, colors, interactive states, and component styling.
- **Numeric Handling:** Convert DB strings to `number` immediately after reading and back to `string` for DB operations.

## Feature Documentation

Detailed documentation for specific features can be found in `docs/features/`. Refer to these files for in-depth understanding of implementation logic and domain rules.

- [Year Settings & Setup](docs/features/year-settings.md): Details on year creation, configuration fields, and prefill logic.
