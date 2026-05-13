# 📊 Gridly — Personal Finance Tracker

Gridly is a premium personal finance tracking app that helps you monitor your income, expenses, savings, and balance across months and years. Designed with a high-fidelity fintech aesthetic, it provides clear, actionable insights into your financial health.

## ✨ Features

- **🏠 Cockpit Overview** — A dedicated current-month dashboard with KPIs, balance tracking, and quick-add actions.
- **📅 Monthly Detail** — Deep-dive into fixed, recurring, and additional movements with real-time inline editing.
- **📈 Annual Insights** — Visualise trends with high-quality charts and KPI summaries for the full year.
- **🔮 Evolution Dashboard** — Multi-year analytics spanning your configured years and pre-Gridly historical imports.
- **🔄 Recurring Expenses** — Define named monthly expenses (rent, subscriptions, etc.) that repeat automatically across the year.
- **🗂️ Historical Imports** — Add summary-only pre-Gridly annual data to enrich your multi-year evolution view.
- **🎮 Demo Mode** — Explore the app with sample data before signing in.
- **📤 Export** — Take your data with you via Excel export.
- **🌍 Multilingual** — Full Spanish and English support via `next-intl`.

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- A running PostgreSQL instance (e.g. [Neon](https://neon.tech))

### Setup

1. Install dependencies:

```bash
npm install
```

2. Copy the example env file and fill in your values:

```bash
cp .env.example .env
```

3. Push the database schema:

```bash
npx drizzle-kit push
```

4. Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 🔐 Authentication

Gridly uses Google sign-in (via NextAuth v5) to protect your private financial data.

Set the following environment variables:

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `AUTH_SECRET` | Random secret for NextAuth session encryption |
| `AUTH_GOOGLE_ID` | Google OAuth client ID |
| `AUTH_GOOGLE_SECRET` | Google OAuth client secret |
| `NEXT_PUBLIC_APP_URL` | Public URL of your deployment |
| `LEGACY_OWNER_EMAIL` | Email to assign pre-auth data to (optional) |

New users start with an empty account and configure their own year on first access.

### 🏁 First Use

1. **Create a year** — enter your starting balance, estimated salary, monthly investment target, home expense, personal budget, interest rate, and any recurring expenses.
2. The app pre-fills all 12 months with your estimates.
3. Each month, open the month view and update the actual figures (payslip received, real home costs, etc.).
4. Use the **Annual** view for charts and KPIs across the full year.
5. Use the **Evolution** view to track your net worth and savings trends across multiple years.

## 🗂️ Project Structure

```
src/
  app/          # Next.js App Router pages and API routes (locale, year, month segments)
  components/   # UI components (annual, monthly, evolution, setup, landing, layout)
  db/           # Drizzle schema and Neon client
  i18n/         # next-intl routing and configuration
  lib/          # Financial calculations, types, export utilities, server actions
  types/        # Shared TypeScript types
messages/       # i18n translation files (es.json, en.json)
docs/features/  # In-depth documentation for each feature
```

## 🛠️ Tech Stack

| Layer | Choice |
|---|---|
| Framework | [Next.js 16](https://nextjs.org) (App Router) |
| Language | TypeScript |
| UI | [React 19](https://react.dev), [Tailwind CSS v4](https://tailwindcss.com), [shadcn/ui](https://ui.shadcn.com) |
| Database | [Drizzle ORM](https://orm.drizzle.team) + [Neon](https://neon.tech) (serverless PostgreSQL) |
| Auth | [NextAuth v5](https://authjs.dev) (Google OAuth) |
| Charts | [Recharts v3](https://recharts.org) |
| i18n | [next-intl](https://next-intl.dev) |
| Export | [ExcelJS](https://github.com/exceljs/exceljs) |

## 🎨 Design System

Gridly uses a custom design system inspired by Stripe's visual language — purple-primary, layered surfaces, and high-contrast typography. All design tokens, principles, and component guidelines are documented in [DESIGN.md](./DESIGN.md).
