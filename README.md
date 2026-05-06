# Gridly — Personal Finance Tracker

Gridly is a premium personal finance tracking app that helps you monitor your income, expenses, savings, and balance across months and years. Designed with a high-fidelity fintech aesthetic, it provides clear, actionable insights into your financial health.

**What it does:**
- **Cockpit Overview:** A dedicated "current-month" dashboard with KPIs, balance tracking, and quick-add actions.
- **Monthly Detail:** Deep-dive into fixed and additional movements with real-time inline editing.
- **Annual Insights:** Visualise trends with high-quality charts and KPI summaries.
- **Guided Setup:** Onboarding experience to configure your year, salary, and investment targets in seconds.
- **Export:** Take your data with you via Excel export.

## Getting Started

### Prerequisites

- Node.js 18+
- A running PostgreSQL instance (connection string goes in `.env`)

### Setup

1. Install dependencies:

```bash
npm install
```

2. Copy the example env file and fill in your database URL:

```bash
cp .env.example .env
```

3. Push the database schema:

```bash
npm run db:push
```

4. Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Authentication

Gridly now uses Google sign-in for all private financial data.

- Set `AUTH_SECRET`, `AUTH_GOOGLE_ID`, and `AUTH_GOOGLE_SECRET` in your local environment.
- Existing legacy data is assigned to `velascoborja@gmail.com`.
- New users start with an empty account and configure their own year on first access.

### Financial data privacy

Set `FINANCIAL_DATA_ENCRYPTION_KEY` to encrypt financial values and operation labels before they are stored in the database. Without this key, Gridly keeps the previous plaintext storage behavior for compatibility. Existing plaintext rows remain readable and are protected when rewritten through normal app flows.

### First use

1. Create a year — enter your starting balance, estimated salary, monthly investment target, home expense, personal budget, and interest rate.
2. The app pre-fills all 12 months with your estimates.
3. Each month, open the month view and update the actual figures (payslip received, real home costs, etc.).
4. Use the annual overview to see your balance chart and KPIs for the full year.

## Project Structure

```
src/
  app/          # Next.js pages and API routes
  components/   # UI components (annual view, monthly view, layout)
  db/           # Database schema and client
  lib/          # Shared types, calculations, and export utilities
```

## Tech Stack

- **Framework:** [Next.js 16](https://nextjs.org) (App Router)
- **State/UI:** [React 19](https://react.dev), [Tailwind CSS v4](https://tailwindcss.com), [shadcn/ui](https://ui.shadcn.com)
- **Database:** [Drizzle ORM](https://orm.drizzle.team) + [Neon](https://neon.tech) (PostgreSQL)
- **Charts:** [Recharts v3](https://recharts.org)

## Design System

Gridly uses a custom design system inspired by Stripe's visual language. All design tokens, principles, and component guidelines are documented in [DESIGN.md](./DESIGN.md).
