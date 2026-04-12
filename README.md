# Gridly — Personal Finance Tracker

Gridly is a personal finance tracking app that helps you monitor your income, expenses, savings, and balance across months and years. You configure your expected salary, fixed costs, and investment targets once per year, then record actual figures each month to see how you're tracking.

**What it does:**
- Track monthly income (payslip, bonuses, additional payslips, interest, and one-off items)
- Track monthly expenses (home, personal budget, investments, and one-off items)
- Compute savings and running balance automatically
- Visualise annual balance and savings trends with charts
- Export year data

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

- [Next.js](https://nextjs.org) — framework
- [Drizzle ORM](https://orm.drizzle.team) — database access
- [shadcn/ui](https://ui.shadcn.com) — component primitives
- [Recharts](https://recharts.org) — charts
