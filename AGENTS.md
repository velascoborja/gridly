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

## Refactor Gate

Before undertaking any refactor that touches more than one file, renames core abstractions, restructures a data flow, or changes a module's public contract — **stop and explain first**:

1. **What** needs to change and why the current structure makes the task impossible or unreasonably risky without it.
2. **Scope** — which files and interfaces will be affected.
3. **Risk** — what could break and how it will be validated afterward.

Then **wait for explicit user confirmation** before writing any code. Do not proceed under the assumption that the user implied consent by asking for the feature. A feature request is not a refactor approval.

This gate applies even when the refactor seems obviously necessary. The cost of pausing is low; the cost of an unwanted structural change is high.

## Test Gate

After every feature implementation or bug fix, run `npm test` and confirm all tests pass before considering the work done. If any tests fail, fix them as part of the same change — do not leave broken tests behind. This applies even when the failures appear unrelated to your change; investigate and resolve them.

## Development Conventions

- **Internationalization (i18n):** Uses `next-intl`. All UI strings must be in `messages/es.json` (Spanish) and `messages/en.json` (English). **Do not hardcode strings.** Use `@/i18n/routing` for all navigation components (Link, useRouter).
- **Localization:** Primary UI language is Spanish. Ensure Spanish translations are provided first.
- **In-Year Routing:** In-year navigation between months, summary, and settings uses local `window.history.pushState()` to avoid refetching `YearData`. Use the shared utilities in `src/lib/year-routes.ts` instead of writing custom path regexes to derive states or construct routes.
- **Data Access:** Client components use `fetch()` to internal APIs; server components use Drizzle directly.
- **Styling:** Adhere to Tailwind CSS v4 and the visual tokens defined in `src/app/globals.css`. For any UI modification, consult `DESIGN.md` first and follow its rules for spacing, elevation, typography, colors, interactive states, and component styling.
- **Numeric Handling:** Convert DB strings to `number` immediately after reading and back to `string` for DB operations.

## Skills

Project-specific skills live in `.agents/skills/<skill-name>/SKILL.md`. They are the **canonical source** for each skill.

When adding a new skill to `.agents/skills/`:
1. Create the full skill content in `.agents/skills/<skill-name>/SKILL.md`.
2. Create a thin reference stub in `.claude/skills/<skill-name>/SKILL.md` that keeps the same `name` and `description` frontmatter but redirects to the canonical file:

```markdown
---
name: <skill-name>
description: <same description as the canonical skill>
---

This skill is defined in the canonical location. Read and follow `.agents/skills/<skill-name>/SKILL.md`.
```

Never duplicate skill content between the two directories — `.claude/skills/` stubs exist only so Claude Code's skill discovery finds them.

## Local-Only Paths

The following paths are intentionally excluded from version control via `.gitignore` and must **never** be committed or pushed:

- `docs/superpowers/` — local Superpowers skill docs and plans
- `docs/plans/` — local implementation plans
- `docs/specs/` — local specs

Do not `git add` files under these directories. Do not use `--force` or any other mechanism to bypass this restriction. These files are for local reference only.

## Feature Documentation

Detailed documentation for specific features can be found in `docs/features/`. **These files are the preferred first stop for context.** Before searching the codebase or reading source files to understand how a feature works, check whether a relevant doc exists below — it covers implementation logic, domain rules, and architectural decisions without requiring code discovery. Only go to the source when the doc is insufficient or absent.

When changing any of the features listed below, update the related documentation in the same change. If the work affects a feature that is not yet documented, add a new feature page under `docs/features/` and link it from this section.

- [Year Settings & Setup](docs/features/year-settings.md): Details on year creation, configuration fields, and prefill logic.
- [Monthly Management](docs/features/monthly-management.md): Core tracking interface for income, fixed expenses, and interest calculations.
- [Annual Summary](docs/features/annual-summary.md): Annual KPI cards, expected-entry estimates, charts, and multi-year comparison context.
- [Recurring Expenses](docs/features/recurring-expenses.md): Annual recurring expense templates and monthly recurring expense copies.
- [Additional Entries](docs/features/additional-entries.md): Management of granular variable expenses and income transactions.
- [Expense Groups](docs/features/expense-groups.md): Grouping additional expenses under named headings within a month.
- [Balance & Interest Logic](docs/features/calculations-engine.md): The mathematical engine behind the month-over-month financial chain.
- [Yearly Carry-over](docs/features/balance-carry-over.md): Automatic synchronization of balances across consecutive years.
- [Data Export](docs/features/data-export.md): Excel workbook generation for offline analysis and data portability.
- [Internationalization](docs/features/internationalization.md): Implementation details for multi-language support and routing.
- [App Icons & Web App Metadata](docs/features/app-icons.md): Browser, manifest, and iOS Safari icon asset conventions.
- [Evolution Dashboard](docs/features/evolution-dashboard.md): Multi-year balance, savings, and investment analytics.
- [Historical Year Imports](docs/features/historical-year-imports.md): Summary-only pre-Gridly annual imports used by Evolution.
- [Keyboard Shortcuts](docs/features/keyboard-shortcuts.md): Full shortcut reference and implementation notes for the keyboard navigation system.
- [Tags](docs/features/tags.md): Color-coded tags assignable to ungrouped expense entries, with inline creation.
- [Help Page](docs/features/help.md): Tabbed in-app feature reference accessible from the Settings page.
