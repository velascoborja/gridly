# Historical Year Imports Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let authenticated users add, edit, and delete summary-only pre-Gridly years so the Evolution dashboard can include longer historical trends without creating monthly data or changing carry-over behavior.

**Architecture:** Store imported annual summaries in a separate `historical_years` table and normalize both full Gridly years and historical rows into a shared Evolution metric source before metric derivation. CRUD lives behind authenticated API routes with server-side eligibility validation; the Evolution page loads merged sources and the client dashboard owns the add/edit/delete dialogs. Navigation receives explicit year source metadata so historical years can be visible while month and annual views stay disabled.

**Tech Stack:** Next.js 16.2.2 App Router route handlers, React 19 client components, Drizzle ORM, Neon Postgres, next-intl, Tailwind CSS v4, shadcn/base-ui primitives, Node `node:test`.

---

## File Structure

- Modify: `src/db/schema.ts`  
  Add `historicalYears` with numeric money fields, `(userId, year)` uniqueness, timestamps, and cascade delete to `users`.
- Modify: `src/lib/types.ts`  
  Add shared `HistoricalYear`, `HistoricalYearInput`, and `YearOption` types.
- Create: `src/lib/historical-years.ts`  
  Pure parsing/serialization helpers and validation helpers for historical import payloads.
- Create: `src/lib/historical-years.test.ts`  
  Unit tests for payload validation and derived saved amount behavior.
- Modify: `src/lib/evolution.ts` and `src/lib/evolution.test.ts`  
  Replace `YearData[]` input with normalized `EvolutionMetricSource[]`, keep Gridly behavior, add historical behavior and `source` on returned metrics.
- Create: `src/lib/server/historical-years.ts`  
  Authenticated-user scoped database helpers for listing, creating, updating, deleting, validating ownership, and merging Evolution sources.
- Create: `src/app/api/historical-years/route.ts`  
  `GET` and `POST` route handlers.
- Create: `src/app/api/historical-years/[id]/route.ts`  
  `PATCH` and `DELETE` route handlers.
- Create: `src/app/api/historical-years/route.test.ts`  
  Source-level tests for auth, validation calls, numeric serialization, and no carry-over propagation.
- Modify: `src/app/[locale]/evolution/page.tsx`  
  Load merged sources, derive metrics from sources, pass historical rows to the dashboard, and pass year options to `AppShell`.
- Modify: `src/components/evolution/evolution-dashboard.tsx`  
  Add header action and pass historical rows into the table for edit/delete actions.
- Create: `src/components/evolution/historical-year-dialog.tsx`  
  Compact add/edit form with localized numeric parsing, saved preview, pending state, and `router.refresh()`.
- Modify: `src/components/evolution/evolution-detail-table.tsx`  
  Add source column, render `null` metrics as unavailable, and add historical-only row actions.
- Modify: `src/components/evolution/evolution-dashboard.test.ts`  
  Add source-level checks for dialog composition, labels, action wiring, and `router.refresh()`.
- Modify: `src/components/layout/app-shell.tsx` and `src/components/layout/nav-selectors.tsx`  
  Accept `YearOption[]`, keep backward compatibility where practical, disable Months and Annual Summary for selected historical years.
- Modify: `src/components/layout/nav-selectors.test.ts`  
  Add source-level tests for historical options, disabled tab hints, and gridly-only create-year behavior.
- Modify: `src/lib/server/year-navigation.ts`  
  Add `pickDefaultYearOption`, `getGridlyYears`, and `getNextCreatableYearFromOptions` helpers while preserving existing number-array helpers for existing callers.
- Modify: `messages/es.json` and `messages/en.json`  
  Add all UI strings in Spanish first, then English.
- Create: `docs/features/historical-year-imports.md`  
  Document summary-only imports, eligibility, data model, and non-effects.
- Modify: `docs/features/evolution-dashboard.md`  
  Explain merged Gridly and historical metric sources.
- Modify: `AGENTS.md`  
  Link the new feature doc in the Feature Documentation section.

---

### Task 1: Schema And Shared Types

**Files:**
- Modify: `src/db/schema.ts`
- Modify: `src/lib/types.ts`
- Create: `src/lib/historical-years.ts`
- Create: `src/lib/historical-years.test.ts`

- [ ] **Step 1: Write failing validation and parsing tests**

Add `src/lib/historical-years.test.ts`:

```ts
import test from "node:test";
import assert from "node:assert/strict";
import {
  deriveHistoricalSavedAmount,
  parseHistoricalYearPayload,
  serializeHistoricalYearMoney,
  validateHistoricalYearEligibility,
} from "./historical-years.ts";

test("parseHistoricalYearPayload accepts finite money values and allows negative savings", () => {
  const parsed = parseHistoricalYearPayload({
    year: 2022,
    startingBalance: 5000,
    finalBalance: 4250,
    investedAmount: 1200,
  });

  assert.deepEqual(parsed, {
    year: 2022,
    startingBalance: 5000,
    finalBalance: 4250,
    investedAmount: 1200,
  });
  assert.equal(deriveHistoricalSavedAmount(parsed), -750);
});

test("parseHistoricalYearPayload rejects invalid year and invested amount", () => {
  assert.equal(parseHistoricalYearPayload({ year: 2022.5, startingBalance: 0, finalBalance: 1, investedAmount: 0 }).error, "invalidYear");
  assert.equal(parseHistoricalYearPayload({ year: 2022, startingBalance: 0, finalBalance: 1, investedAmount: -1 }).error, "invalidInvestedAmount");
});

test("validateHistoricalYearEligibility enforces pre-Gridly-only imports", () => {
  assert.equal(validateHistoricalYearEligibility({ year: 2023, gridlyYears: [], historicalYears: [] }), "missingGridlyYear");
  assert.equal(validateHistoricalYearEligibility({ year: 2024, gridlyYears: [2024], historicalYears: [] }), "yearNotBeforeFirstGridlyYear");
  assert.equal(validateHistoricalYearEligibility({ year: 2023, gridlyYears: [2024], historicalYears: [2023] }), "duplicateHistoricalYear");
  assert.equal(validateHistoricalYearEligibility({ year: 2023, gridlyYears: [2024], historicalYears: [2023], currentHistoricalYear: 2023 }), null);
});

test("serializeHistoricalYearMoney converts numeric fields to Drizzle numeric strings", () => {
  assert.deepEqual(serializeHistoricalYearMoney({
    year: 2022,
    startingBalance: 1000.5,
    finalBalance: 1200.25,
    investedAmount: 300,
  }), {
    year: 2022,
    startingBalance: "1000.50",
    finalBalance: "1200.25",
    investedAmount: "300.00",
  });
});
```

- [ ] **Step 2: Run the new test to verify it fails**

Run: `rtk npm test -- src/lib/historical-years.test.ts`  
Expected: FAIL because `src/lib/historical-years.ts` does not exist.

- [ ] **Step 3: Add shared types**

In `src/lib/types.ts`, append:

```ts
export interface HistoricalYear {
  id: number;
  userId: string;
  year: number;
  startingBalance: number;
  finalBalance: number;
  investedAmount: number;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface HistoricalYearInput {
  year: number;
  startingBalance: number;
  finalBalance: number;
  investedAmount: number;
}

export interface YearOption {
  year: number;
  source: "gridly" | "historical";
}
```

- [ ] **Step 4: Add the schema table**

In `src/db/schema.ts`, add `historicalYears` after `years`:

```ts
export const historicalYears = pgTable("historical_years", {
  id: serial("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  year: integer("year").notNull(),
  startingBalance: numeric("starting_balance", { precision: 12, scale: 2 }).notNull().default("0"),
  finalBalance: numeric("final_balance", { precision: 12, scale: 2 }).notNull().default("0"),
  investedAmount: numeric("invested_amount", { precision: 12, scale: 2 }).notNull().default("0"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (t) => [unique().on(t.userId, t.year)]);
```

- [ ] **Step 5: Add pure historical-year helpers**

Create `src/lib/historical-years.ts`:

```ts
import type { HistoricalYearInput } from "./types";

export type HistoricalYearValidationError =
  | "missingGridlyYear"
  | "invalidYear"
  | "yearNotBeforeFirstGridlyYear"
  | "yearAlreadyExistsAsGridly"
  | "duplicateHistoricalYear"
  | "invalidStartingBalance"
  | "invalidFinalBalance"
  | "invalidInvestedAmount";

export type HistoricalYearPayloadResult =
  | HistoricalYearInput
  | { error: HistoricalYearValidationError };

function isFiniteCurrencyValue(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function parseHistoricalYearPayload(payload: unknown): HistoricalYearPayloadResult {
  const body = payload && typeof payload === "object" ? payload as Record<string, unknown> : {};
  const year = body.year;
  const startingBalance = body.startingBalance;
  const finalBalance = body.finalBalance;
  const investedAmount = body.investedAmount;

  if (!Number.isInteger(year)) return { error: "invalidYear" };
  if (!isFiniteCurrencyValue(startingBalance)) return { error: "invalidStartingBalance" };
  if (!isFiniteCurrencyValue(finalBalance)) return { error: "invalidFinalBalance" };
  if (!isFiniteCurrencyValue(investedAmount) || investedAmount < 0) return { error: "invalidInvestedAmount" };

  return { year, startingBalance, finalBalance, investedAmount };
}

export function validateHistoricalYearEligibility({
  year,
  gridlyYears,
  historicalYears,
  currentHistoricalYear,
}: {
  year: number;
  gridlyYears: number[];
  historicalYears: number[];
  currentHistoricalYear?: number;
}): HistoricalYearValidationError | null {
  if (!Number.isInteger(year)) return "invalidYear";
  if (gridlyYears.length === 0) return "missingGridlyYear";
  if (gridlyYears.includes(year)) return "yearAlreadyExistsAsGridly";

  const earliestGridlyYear = Math.min(...gridlyYears);
  if (year >= earliestGridlyYear) return "yearNotBeforeFirstGridlyYear";

  const duplicatesAnotherHistoricalYear = historicalYears.some(
    (candidate) => candidate === year && candidate !== currentHistoricalYear
  );
  if (duplicatesAnotherHistoricalYear) return "duplicateHistoricalYear";

  return null;
}

export function deriveHistoricalSavedAmount(input: Pick<HistoricalYearInput, "startingBalance" | "finalBalance">): number {
  return input.finalBalance - input.startingBalance;
}

export function serializeHistoricalYearMoney(input: HistoricalYearInput) {
  return {
    year: input.year,
    startingBalance: input.startingBalance.toFixed(2),
    finalBalance: input.finalBalance.toFixed(2),
    investedAmount: input.investedAmount.toFixed(2),
  };
}
```

- [ ] **Step 6: Run the focused test**

Run: `rtk npm test -- src/lib/historical-years.test.ts`  
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
rtk git add src/db/schema.ts src/lib/types.ts src/lib/historical-years.ts src/lib/historical-years.test.ts
rtk git commit -m "feat: add historical year schema and validation"
```

---

### Task 2: Evolution Metrics Accept Normalized Sources

**Files:**
- Modify: `src/lib/evolution.ts`
- Modify: `src/lib/evolution.test.ts`

- [ ] **Step 1: Update tests for mixed Gridly and historical sources**

In `src/lib/evolution.test.ts`, update calls from `deriveEvolutionMetrics([yearData(...)])` to `deriveEvolutionMetrics([{ source: "gridly", yearData: yearData(...) }])`. Add this test:

```ts
test("deriveEvolutionMetrics merges gridly and historical sources chronologically", () => {
  const metrics = deriveEvolutionMetrics([
    { source: "gridly", yearData: yearData(2024, 1000, [month({ month: 12, investment: 200, totalIncome: 2000, totalExpenses: 1200, endingBalance: 1800 })]) },
    { source: "historical", year: 2022, startingBalance: 500, finalBalance: 900, investedAmount: 100 },
    { source: "historical", year: 2023, startingBalance: 900, finalBalance: 750, investedAmount: 50 },
  ]);

  assert.deepEqual(metrics.map((metric) => ({
    source: metric.source,
    year: metric.year,
    savedAmount: metric.savedAmount,
    investedAmount: metric.investedAmount,
    accumulatedInvested: metric.accumulatedInvested,
    totalIncome: metric.totalIncome,
    totalExpenses: metric.totalExpenses,
    savingsRate: metric.savingsRate,
  })), [
    {
      source: "historical",
      year: 2022,
      savedAmount: 400,
      investedAmount: 100,
      accumulatedInvested: 100,
      totalIncome: null,
      totalExpenses: null,
      savingsRate: null,
    },
    {
      source: "historical",
      year: 2023,
      savedAmount: -150,
      investedAmount: 50,
      accumulatedInvested: 150,
      totalIncome: null,
      totalExpenses: null,
      savingsRate: null,
    },
    {
      source: "gridly",
      year: 2024,
      savedAmount: 800,
      investedAmount: 200,
      accumulatedInvested: 350,
      totalIncome: 2000,
      totalExpenses: 1200,
      savingsRate: 800 / 2000,
    },
  ]);
});
```

- [ ] **Step 2: Run the focused test to verify it fails**

Run: `rtk npm test -- src/lib/evolution.test.ts`  
Expected: FAIL because `deriveEvolutionMetrics` still accepts `YearData[]` and metrics do not include `source`.

- [ ] **Step 3: Update metric source and metric types**

In `src/lib/evolution.ts`, replace the top section with:

```ts
import type { YearData } from "./types";

export type EvolutionMetricSource =
  | { source: "gridly"; yearData: YearData }
  | {
      source: "historical";
      year: number;
      startingBalance: number;
      finalBalance: number;
      investedAmount: number;
    };

export interface EvolutionYearMetric {
  source: "gridly" | "historical";
  year: number;
  startingBalance: number;
  finalBalance: number;
  savedAmount: number;
  investedAmount: number;
  accumulatedInvested: number;
  totalIncome: number | null;
  totalExpenses: number | null;
  savingsRate: number | null;
}
```

- [ ] **Step 4: Replace `deriveEvolutionMetrics` implementation**

In `src/lib/evolution.ts`, replace `deriveEvolutionMetrics` with:

```ts
export function deriveEvolutionMetrics(sources: EvolutionMetricSource[]): EvolutionYearMetric[] {
  const sortedSources = [...sources].sort((a, b) => {
    const aYear = a.source === "gridly" ? a.yearData.config.year : a.year;
    const bYear = b.source === "gridly" ? b.yearData.config.year : b.year;
    return aYear - bYear;
  });
  let accumulatedInvested = 0;
  const metrics: EvolutionYearMetric[] = [];

  for (const source of sortedSources) {
    if (source.source === "historical") {
      accumulatedInvested += source.investedAmount;
      metrics.push({
        source: "historical",
        year: source.year,
        startingBalance: source.startingBalance,
        finalBalance: source.finalBalance,
        savedAmount: source.finalBalance - source.startingBalance,
        investedAmount: source.investedAmount,
        accumulatedInvested,
        totalIncome: null,
        totalExpenses: null,
        savingsRate: null,
      });
      continue;
    }

    const yearData = source.yearData;
    const december = yearData.months.find((month) => month.month === 12);
    if (!december) continue;

    const investedAmount = yearData.months.reduce((sum, month) => sum + month.investment, 0);
    const totalIncome = yearData.months.reduce((sum, month) => sum + month.totalIncome, 0);
    const totalExpenses = yearData.months.reduce((sum, month) => sum + month.totalExpenses, 0);
    const savedAmount = december.endingBalance - yearData.config.startingBalance;
    accumulatedInvested += investedAmount;

    metrics.push({
      source: "gridly",
      year: yearData.config.year,
      startingBalance: yearData.config.startingBalance,
      finalBalance: december.endingBalance,
      savedAmount,
      investedAmount,
      accumulatedInvested,
      totalIncome,
      totalExpenses,
      savingsRate: totalIncome > 0 ? savedAmount / totalIncome : null,
    });
  }

  return metrics;
}
```

- [ ] **Step 5: Run metric tests**

Run: `rtk npm test -- src/lib/evolution.test.ts`  
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
rtk git add src/lib/evolution.ts src/lib/evolution.test.ts
rtk git commit -m "feat: support historical evolution metric sources"
```

---

### Task 3: Server Persistence Helpers

**Files:**
- Create: `src/lib/server/historical-years.ts`
- Modify: `src/lib/server/year-navigation.ts`

- [ ] **Step 1: Add server helper source tests**

Add source-level assertions to `src/components/layout/nav-selectors.test.ts` or create `src/lib/server/year-navigation.test.ts`:

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("historical year server helper scopes queries to the authenticated user and merges evolution sources", () => {
  const source = readFileSync(new URL("./historical-years.ts", import.meta.url), "utf8");

  assert.match(source, /eq\(historicalYears\.userId, userId\)/);
  assert.match(source, /parseHistoricalYearRow/);
  assert.match(source, /getEvolutionSourcesForUser/);
  assert.match(source, /source: "historical"/);
  assert.match(source, /source: "gridly"/);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `rtk npm test -- src/lib/server/year-navigation.test.ts`  
Expected: FAIL until the helper exists.

- [ ] **Step 3: Implement server helpers**

Create `src/lib/server/historical-years.ts`:

```ts
import { and, asc, eq, lte } from "drizzle-orm";
import { db } from "@/db";
import { historicalYears } from "@/db/schema";
import {
  parseHistoricalYearPayload,
  serializeHistoricalYearMoney,
  validateHistoricalYearEligibility,
  type HistoricalYearValidationError,
} from "@/lib/historical-years";
import type { HistoricalYear, HistoricalYearInput } from "@/lib/types";
import type { EvolutionMetricSource } from "@/lib/evolution";
import { getAllYearDataForUser, getYearsForUser } from "./year-data";

export function parseHistoricalYearRow(row: typeof historicalYears.$inferSelect): HistoricalYear {
  return {
    id: row.id,
    userId: row.userId,
    year: row.year,
    startingBalance: parseFloat(row.startingBalance),
    finalBalance: parseFloat(row.finalBalance),
    investedAmount: parseFloat(row.investedAmount),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function getHistoricalYearsForUser(userId: string, options: { maxYear?: number } = {}) {
  const predicates = [eq(historicalYears.userId, userId)];
  if (options.maxYear !== undefined) predicates.push(lte(historicalYears.year, options.maxYear));

  const rows = await db
    .select()
    .from(historicalYears)
    .where(and(...predicates))
    .orderBy(asc(historicalYears.year));

  return rows.map(parseHistoricalYearRow);
}

async function validateHistoricalYearForWrite(
  userId: string,
  input: HistoricalYearInput,
  currentHistoricalRow?: HistoricalYear
): Promise<HistoricalYearValidationError | null> {
  const [gridlyYears, historicalRows] = await Promise.all([
    getYearsForUser(userId),
    getHistoricalYearsForUser(userId),
  ]);

  return validateHistoricalYearEligibility({
    year: input.year,
    gridlyYears,
    historicalYears: historicalRows.map((row) => row.year),
    currentHistoricalYear: currentHistoricalRow?.year,
  });
}

export async function createHistoricalYearForUser(userId: string, payload: unknown) {
  const parsed = parseHistoricalYearPayload(payload);
  if ("error" in parsed) return { ok: false as const, error: parsed.error, status: 400 };

  const validationError = await validateHistoricalYearForWrite(userId, parsed);
  if (validationError) return { ok: false as const, error: validationError, status: validationError === "duplicateHistoricalYear" ? 409 : 400 };

  const [row] = await db
    .insert(historicalYears)
    .values({ userId, ...serializeHistoricalYearMoney(parsed) })
    .returning();

  return { ok: true as const, historicalYear: parseHistoricalYearRow(row) };
}

export async function updateHistoricalYearForUser(userId: string, id: number, payload: unknown) {
  const existing = await db.query.historicalYears.findFirst({
    where: and(eq(historicalYears.userId, userId), eq(historicalYears.id, id)),
  });
  if (!existing) return { ok: false as const, error: "notFound", status: 404 };

  const parsed = parseHistoricalYearPayload(payload);
  if ("error" in parsed) return { ok: false as const, error: parsed.error, status: 400 };

  const validationError = await validateHistoricalYearForWrite(userId, parsed, parseHistoricalYearRow(existing));
  if (validationError) return { ok: false as const, error: validationError, status: validationError === "duplicateHistoricalYear" ? 409 : 400 };

  const [row] = await db
    .update(historicalYears)
    .set({ ...serializeHistoricalYearMoney(parsed), updatedAt: new Date() })
    .where(and(eq(historicalYears.userId, userId), eq(historicalYears.id, id)))
    .returning();

  return { ok: true as const, historicalYear: parseHistoricalYearRow(row) };
}

export async function deleteHistoricalYearForUser(userId: string, id: number) {
  const [row] = await db
    .delete(historicalYears)
    .where(and(eq(historicalYears.userId, userId), eq(historicalYears.id, id)))
    .returning({ id: historicalYears.id });

  if (!row) return { ok: false as const, error: "notFound", status: 404 };
  return { ok: true as const };
}

export async function getEvolutionSourcesForUser(userId: string, maxYear: number): Promise<EvolutionMetricSource[]> {
  const [historicalRows, gridlyYearData] = await Promise.all([
    getHistoricalYearsForUser(userId, { maxYear }),
    getAllYearDataForUser(userId, { maxYear }),
  ]);

  return [
    ...historicalRows.map((row): EvolutionMetricSource => ({
      source: "historical",
      year: row.year,
      startingBalance: row.startingBalance,
      finalBalance: row.finalBalance,
      investedAmount: row.investedAmount,
    })),
    ...gridlyYearData.map((yearData): EvolutionMetricSource => ({ source: "gridly", yearData })),
  ].sort((a, b) => {
    const aYear = a.source === "gridly" ? a.yearData.config.year : a.year;
    const bYear = b.source === "gridly" ? b.yearData.config.year : b.year;
    return aYear - bYear;
  });
}
```

If Drizzle query helpers do not expose `db.query.historicalYears` before relation typing updates, replace that lookup with a `select().from(historicalYears).where(...).limit(1)` pattern.

- [ ] **Step 4: Add year option helpers**

In `src/lib/server/year-navigation.ts`, append:

```ts
import type { YearOption } from "@/lib/types";

export function getGridlyYears(options: YearOption[]): number[] {
  return options.filter((option) => option.source === "gridly").map((option) => option.year);
}

export function getNextCreatableYearFromOptions(options: YearOption[], fallbackYear: number): number {
  return getNextCreatableYear(getGridlyYears(options), fallbackYear);
}

export function pickDefaultYearOption(options: YearOption[], currentYear: number): YearOption {
  const current = options.find((option) => option.year === currentYear && option.source === "gridly");
  if (current) return current;

  const gridlyOptions = options.filter((option) => option.source === "gridly");
  if (gridlyOptions.length > 0) return gridlyOptions.reduce((latest, option) => option.year > latest.year ? option : latest);

  return { year: currentYear, source: "gridly" };
}
```

- [ ] **Step 5: Run focused tests**

Run: `rtk npm test -- src/lib/server/year-navigation.test.ts src/components/layout/nav-selectors.test.ts`  
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
rtk git add src/lib/server/historical-years.ts src/lib/server/year-navigation.ts src/lib/server/year-navigation.test.ts src/components/layout/nav-selectors.test.ts
rtk git commit -m "feat: add historical year server helpers"
```

---

### Task 4: Historical Year API Routes

**Files:**
- Create: `src/app/api/historical-years/route.ts`
- Create: `src/app/api/historical-years/[id]/route.ts`
- Create: `src/app/api/historical-years/route.test.ts`

- [ ] **Step 1: Write API source tests**

Create `src/app/api/historical-years/route.test.ts`:

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("historical years collection route requires auth and delegates validation", () => {
  const source = readFileSync(new URL("./route.ts", import.meta.url), "utf8");

  assert.match(source, /getSessionUser/);
  assert.match(source, /status: 401/);
  assert.match(source, /getHistoricalYearsForUser/);
  assert.match(source, /createHistoricalYearForUser/);
});

test("historical years item route requires ownership for update and delete", () => {
  const source = readFileSync(new URL("./[id]/route.ts", import.meta.url), "utf8");

  assert.match(source, /getSessionUser/);
  assert.match(source, /updateHistoricalYearForUser/);
  assert.match(source, /deleteHistoricalYearForUser/);
  assert.match(source, /status: result.status/);
});

test("historical years API does not trigger carry-over propagation", () => {
  const collection = readFileSync(new URL("./route.ts", import.meta.url), "utf8");
  const item = readFileSync(new URL("./[id]/route.ts", import.meta.url), "utf8");

  assert.doesNotMatch(collection, /propagateYearCarryOver/);
  assert.doesNotMatch(item, /propagateYearCarryOver/);
});
```

- [ ] **Step 2: Run the API test to verify it fails**

Run: `rtk npm test -- src/app/api/historical-years/route.test.ts`  
Expected: FAIL because route files do not exist.

- [ ] **Step 3: Implement collection route**

Create `src/app/api/historical-years/route.ts`:

```ts
import { createHistoricalYearForUser, getHistoricalYearsForUser } from "@/lib/server/historical-years";
import { getSessionUser } from "@/lib/server/session";

export async function GET() {
  const user = await getSessionUser();
  if (!user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await getHistoricalYearsForUser(user.id);
  return Response.json(rows);
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await createHistoricalYearForUser(user.id, await request.json());
  if (!result.ok) {
    return Response.json({ error: result.error }, { status: result.status });
  }

  return Response.json(result.historicalYear, { status: 201 });
}
```

- [ ] **Step 4: Implement item route**

Create `src/app/api/historical-years/[id]/route.ts`:

```ts
import { deleteHistoricalYearForUser, updateHistoricalYearForUser } from "@/lib/server/historical-years";
import { getSessionUser } from "@/lib/server/session";

function parseRouteId(value: string): number | null {
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : null;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const parsedId = parseRouteId(id);
  if (parsedId === null) {
    return Response.json({ error: "Invalid id" }, { status: 400 });
  }

  const result = await updateHistoricalYearForUser(user.id, parsedId, await request.json());
  if (!result.ok) {
    return Response.json({ error: result.error }, { status: result.status });
  }

  return Response.json(result.historicalYear);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const parsedId = parseRouteId(id);
  if (parsedId === null) {
    return Response.json({ error: "Invalid id" }, { status: 400 });
  }

  const result = await deleteHistoricalYearForUser(user.id, parsedId);
  if (!result.ok) {
    return Response.json({ error: result.error }, { status: result.status });
  }

  return Response.json({ ok: true });
}
```

- [ ] **Step 5: Run API tests**

Run: `rtk npm test -- src/app/api/historical-years/route.test.ts`  
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
rtk git add src/app/api/historical-years/route.ts src/app/api/historical-years/[id]/route.ts src/app/api/historical-years/route.test.ts
rtk git commit -m "feat: add historical year api routes"
```

---

### Task 5: Evolution Page Loading And Dashboard UI

**Files:**
- Modify: `src/app/[locale]/evolution/page.tsx`
- Modify: `src/components/evolution/evolution-dashboard.tsx`
- Create: `src/components/evolution/historical-year-dialog.tsx`
- Modify: `src/components/evolution/evolution-detail-table.tsx`
- Modify: `src/components/evolution/evolution-dashboard.test.ts`
- Modify: `messages/es.json`
- Modify: `messages/en.json`

- [ ] **Step 1: Add UI source tests**

In `src/components/evolution/evolution-dashboard.test.ts`, add:

```ts
test("evolution dashboard exposes historical year create dialog and passes row actions to the detail table", () => {
  const dashboard = readFileSync(new URL("./evolution-dashboard.tsx", import.meta.url), "utf8");
  const table = readFileSync(new URL("./evolution-detail-table.tsx", import.meta.url), "utf8");
  const dialog = readFileSync(new URL("./historical-year-dialog.tsx", import.meta.url), "utf8");

  assert.match(dashboard, /HistoricalYearDialog/);
  assert.match(dashboard, /t\("addHistoricalYear"\)/);
  assert.match(table, /metric\.source === "historical"/);
  assert.match(table, /onEditHistoricalYear/);
  assert.match(table, /onDeleteHistoricalYear/);
  assert.match(dialog, /parseLocalizedNumber/);
  assert.match(dialog, /sanitizeNumericInput/);
  assert.match(dialog, /router\.refresh\(\)/);
});

test("evolution messages include historical year import copy in both locales", () => {
  const spanish = JSON.parse(readFileSync(new URL("../../../messages/es.json", import.meta.url), "utf8"));
  const english = JSON.parse(readFileSync(new URL("../../../messages/en.json", import.meta.url), "utf8"));

  assert.equal(spanish.Evolution.addHistoricalYear, "Añadir año histórico");
  assert.equal(english.Evolution.addHistoricalYear, "Add historical year");
  assert.equal(spanish.Evolution.source.historical, "Histórico");
  assert.equal(english.Evolution.source.historical, "Historical");
});
```

- [ ] **Step 2: Run dashboard tests to verify failure**

Run: `rtk npm test -- src/components/evolution/evolution-dashboard.test.ts`  
Expected: FAIL because the dialog and new strings are missing.

- [ ] **Step 3: Update Evolution server page**

In `src/app/[locale]/evolution/page.tsx`, change loading to:

```tsx
import { getAppRedirectPath, getYearsForUser } from "@/lib/server/year-data";
import { getEvolutionSourcesForUser, getHistoricalYearsForUser } from "@/lib/server/historical-years";

// inside the component
const [years, historicalRows, evolutionSources] = await Promise.all([
  getYearsForUser(user.id),
  getHistoricalYearsForUser(user.id, { maxYear: calendarYear }),
  getEvolutionSourcesForUser(user.id, calendarYear),
]);
const metrics = deriveEvolutionMetrics(evolutionSources);
const yearOptions = [
  ...historicalRows.map((row) => ({ year: row.year, source: "historical" as const })),
  ...years.map((year) => ({ year, source: "gridly" as const })),
].sort((a, b) => a.year - b.year);
```

Pass `yearOptions` into `AppShell` and pass `historicalRows` into `EvolutionDashboard`:

```tsx
<AppShell
  currentYear={currentYear}
  currentMonth={now.getMonth() + 1}
  view="evolution"
  years={yearOptions}
  user={user}
>
  <EvolutionDashboard metrics={metrics} historicalYears={historicalRows} />
</AppShell>
```

- [ ] **Step 4: Create the historical year dialog**

Create `src/components/evolution/historical-year-dialog.tsx`:

```tsx
"use client";

import { useRouter } from "@/i18n/routing";
import { parseLocalizedNumber, sanitizeNumericInput } from "@/lib/currency-input";
import type { HistoricalYear } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState, type FormEvent } from "react";

interface Props {
  open: boolean;
  mode: "create" | "edit";
  historicalYear?: HistoricalYear | null;
  onOpenChange: (open: boolean) => void;
}

export function HistoricalYearDialog({ open, mode, historicalYear, onOpenChange }: Props) {
  const t = useTranslations("Evolution.historicalYearForm");
  const locale = useLocale();
  const router = useRouter();
  const [values, setValues] = useState({
    year: "",
    startingBalance: "",
    finalBalance: "",
    investedAmount: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setError("");
    setValues({
      year: historicalYear ? String(historicalYear.year) : "",
      startingBalance: historicalYear ? String(historicalYear.startingBalance) : "",
      finalBalance: historicalYear ? String(historicalYear.finalBalance) : "",
      investedAmount: historicalYear ? String(historicalYear.investedAmount) : "",
    });
  }, [historicalYear, open]);

  const savedPreview = parseLocalizedNumber(values.finalBalance) - parseLocalizedNumber(values.startingBalance);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    const payload = {
      year: Number(values.year),
      startingBalance: parseLocalizedNumber(values.startingBalance),
      finalBalance: parseLocalizedNumber(values.finalBalance),
      investedAmount: parseLocalizedNumber(values.investedAmount),
    };
    const url = mode === "edit" && historicalYear ? `/api/historical-years/${historicalYear.id}` : "/api/historical-years";
    const method = mode === "edit" ? "PATCH" : "POST";

    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        setError(t(`errors.${body.error ?? "generic"}`));
        return;
      }

      onOpenChange(false);
      router.refresh();
    } catch {
      setError(t("errors.connection"));
    } finally {
      setSubmitting(false);
    }
  };

  const updateCurrency = (key: "startingBalance" | "finalBalance" | "investedAmount", value: string) => {
    setValues((prev) => ({ ...prev, [key]: sanitizeNumericInput(value) }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === "edit" ? t("editTitle") : t("createTitle")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground" htmlFor="historical-year">{t("year")}</label>
            <Input
              id="historical-year"
              inputMode="numeric"
              value={values.year}
              onChange={(event) => setValues((prev) => ({ ...prev, year: event.target.value.replace(/\D/g, "") }))}
              disabled={submitting}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground" htmlFor="historical-starting-balance">{t("startingBalance")}</label>
            <Input id="historical-starting-balance" inputMode="decimal" value={values.startingBalance} onChange={(event) => updateCurrency("startingBalance", event.target.value)} disabled={submitting} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground" htmlFor="historical-final-balance">{t("finalBalance")}</label>
            <Input id="historical-final-balance" inputMode="decimal" value={values.finalBalance} onChange={(event) => updateCurrency("finalBalance", event.target.value)} disabled={submitting} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground" htmlFor="historical-invested-amount">{t("investedAmount")}</label>
            <Input id="historical-invested-amount" inputMode="decimal" value={values.investedAmount} onChange={(event) => updateCurrency("investedAmount", event.target.value)} disabled={submitting} />
          </div>
          <div className="rounded-md border border-primary/20 bg-primary/[0.05] px-3 py-2 text-sm">
            <span className="text-muted-foreground">{t("savedPreview")}</span>
            <span className="finance-number ml-2 text-foreground">{formatCurrency(savedPreview, locale)}</span>
          </div>
          {error ? <p role="alert" className="rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p> : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>{t("cancel")}</Button>
            <Button type="submit" disabled={submitting}>{submitting ? t("submitting") : mode === "edit" ? t("save") : t("create")}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 5: Wire dashboard state**

In `src/components/evolution/evolution-dashboard.tsx`, add `historicalYears` to props, add dialog state, and render the add action near the header:

```tsx
import { Button } from "@/components/ui/button";
import { HistoricalYearDialog } from "./historical-year-dialog";
import type { HistoricalYear } from "@/lib/types";
import { Plus } from "lucide-react";
import { useState } from "react";

interface Props {
  metrics: EvolutionYearMetric[];
  historicalYears: HistoricalYear[];
}
```

Inside the component:

```tsx
const [dialogOpen, setDialogOpen] = useState(false);
const [editingHistoricalYear, setEditingHistoricalYear] = useState<HistoricalYear | null>(null);
```

Render a `Button` with `Plus` and `{t("addHistoricalYear")}` in the hero section, then:

```tsx
<EvolutionDetailTable
  metrics={metrics}
  historicalYears={historicalYears}
  onEditHistoricalYear={(row) => {
    setEditingHistoricalYear(row);
    setDialogOpen(true);
  }}
/>
<HistoricalYearDialog
  open={dialogOpen}
  mode={editingHistoricalYear ? "edit" : "create"}
  historicalYear={editingHistoricalYear}
  onOpenChange={(open) => {
    setDialogOpen(open);
    if (!open) setEditingHistoricalYear(null);
  }}
/>
```

- [ ] **Step 6: Update the detail table**

In `src/components/evolution/evolution-detail-table.tsx`, add a source column before year, use `formatOptionalCurrency`, and show edit/delete controls only for historical rows. Keep `min-w` at least `960px`.

```tsx
function formatOptionalCurrency(value: number | null, locale: string, fallback: string) {
  return value === null ? fallback : formatCurrency(value, locale);
}
```

When rendering `totalIncome` and `totalExpenses`, use:

```tsx
{formatOptionalCurrency(metric.totalIncome, locale, t("notAvailable"))}
```

- [ ] **Step 7: Add Spanish then English messages**

In `messages/es.json`, add under `Evolution`:

```json
"addHistoricalYear": "Añadir año histórico",
"source": {
  "gridly": "Gridly",
  "historical": "Histórico"
},
"historicalYearForm": {
  "createTitle": "Añadir año histórico",
  "editTitle": "Editar año histórico",
  "description": "Añade datos anuales agregados de antes de usar Gridly.",
  "year": "Año",
  "startingBalance": "Saldo inicial",
  "finalBalance": "Saldo final del año",
  "investedAmount": "Importe total invertido",
  "savedPreview": "Ahorro total",
  "create": "Añadir",
  "save": "Guardar",
  "cancel": "Cancelar",
  "submitting": "Guardando...",
  "errors": {
    "missingGridlyYear": "Primero necesitas tener al menos un año completo en Gridly.",
    "invalidYear": "Introduce un año válido.",
    "yearNotBeforeFirstGridlyYear": "El año histórico debe ser anterior al primer año completo en Gridly.",
    "yearAlreadyExistsAsGridly": "Ese año ya existe como año completo en Gridly.",
    "duplicateHistoricalYear": "Ese año histórico ya existe.",
    "invalidStartingBalance": "Introduce un saldo inicial válido.",
    "invalidFinalBalance": "Introduce un saldo final válido.",
    "invalidInvestedAmount": "La inversión debe ser cero o mayor.",
    "connection": "No se ha podido guardar. Revisa la conexión e inténtalo de nuevo.",
    "generic": "No se ha podido guardar el año histórico."
  }
}
```

Mirror the same keys in `messages/en.json` with English copy.

- [ ] **Step 8: Run dashboard tests**

Run: `rtk npm test -- src/components/evolution/evolution-dashboard.test.ts`  
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
rtk git add 'src/app/[locale]/evolution/page.tsx' src/components/evolution/evolution-dashboard.tsx src/components/evolution/historical-year-dialog.tsx src/components/evolution/evolution-detail-table.tsx src/components/evolution/evolution-dashboard.test.ts messages/es.json messages/en.json
rtk git commit -m "feat: add historical year evolution ui"
```

---

### Task 6: Delete Confirmation And Row Actions

**Files:**
- Modify: `src/components/evolution/evolution-detail-table.tsx`
- Modify: `messages/es.json`
- Modify: `messages/en.json`
- Modify: `src/components/evolution/evolution-dashboard.test.ts`

- [ ] **Step 1: Add source tests for delete confirmation**

Add to `src/components/evolution/evolution-dashboard.test.ts`:

```ts
test("historical year delete uses confirmation copy and refreshes after delete", () => {
  const table = readFileSync(new URL("./evolution-detail-table.tsx", import.meta.url), "utf8");
  const spanish = JSON.parse(readFileSync(new URL("../../../messages/es.json", import.meta.url), "utf8"));
  const english = JSON.parse(readFileSync(new URL("../../../messages/en.json", import.meta.url), "utf8"));

  assert.match(table, /AlertDialog/);
  assert.match(table, /DELETE/);
  assert.match(table, /router\.refresh\(\)/);
  assert.equal(spanish.Evolution.deleteHistoricalYear.title, "¿Eliminar año histórico?");
  assert.equal(english.Evolution.deleteHistoricalYear.title, "Delete historical year?");
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `rtk npm test -- src/components/evolution/evolution-dashboard.test.ts`  
Expected: FAIL because delete is not implemented.

- [ ] **Step 3: Implement delete confirmation**

In `src/components/evolution/evolution-detail-table.tsx`, import `useRouter`, alert-dialog components, and icons:

```tsx
import { useRouter } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Pencil, Trash2 } from "lucide-react";
```

Add props:

```tsx
historicalYears: HistoricalYear[];
onEditHistoricalYear: (row: HistoricalYear) => void;
```

Build lookup and delete handler:

```tsx
const router = useRouter();
const historicalByYear = new Map(historicalYears.map((row) => [row.year, row]));

const deleteHistoricalYear = async (row: HistoricalYear) => {
  const response = await fetch(`/api/historical-years/${row.id}`, { method: "DELETE" });
  if (response.ok) router.refresh();
};
```

For each historical metric, render icon buttons for edit and delete. The delete button must be inside `AlertDialogTrigger`, with title/description/action/cancel from `Evolution.deleteHistoricalYear`.

- [ ] **Step 4: Add delete messages**

In `messages/es.json` under `Evolution`:

```json
"deleteHistoricalYear": {
  "title": "¿Eliminar año histórico?",
  "description": "Se eliminará {year} de la evolución. No afecta a ningún año completo de Gridly.",
  "confirm": "Eliminar",
  "cancel": "Cancelar"
}
```

In `messages/en.json`, use:

```json
"deleteHistoricalYear": {
  "title": "Delete historical year?",
  "description": "{year} will be removed from Evolution. Full Gridly years are not affected.",
  "confirm": "Delete",
  "cancel": "Cancel"
}
```

- [ ] **Step 5: Run tests**

Run: `rtk npm test -- src/components/evolution/evolution-dashboard.test.ts`  
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
rtk git add src/components/evolution/evolution-detail-table.tsx src/components/evolution/evolution-dashboard.test.ts messages/es.json messages/en.json
rtk git commit -m "feat: add historical year delete actions"
```

---

### Task 7: Year Navigation With Historical Options

**Files:**
- Modify: `src/components/layout/app-shell.tsx`
- Modify: `src/components/layout/nav-selectors.tsx`
- Modify: `src/components/layout/nav-selectors.test.ts`
- Modify: `messages/es.json`
- Modify: `messages/en.json`

- [ ] **Step 1: Add navigation tests**

In `src/components/layout/nav-selectors.test.ts`, add:

```ts
test("navigation accepts sourced year options and disables full-year views for historical selections", () => {
  const source = readFileSync(new URL("./nav-selectors.tsx", import.meta.url), "utf8");
  const spanish = JSON.parse(readFileSync(new URL("../../../messages/es.json", import.meta.url), "utf8"));
  const english = JSON.parse(readFileSync(new URL("../../../messages/en.json", import.meta.url), "utf8"));

  assert.match(source, /YearOption/);
  assert.match(source, /selectedYearOption\?\.source === "historical"/);
  assert.match(source, /historicalYearUnavailable/);
  assert.match(source, /getGridlyYears/);
  assert.equal(spanish.Nav.historicalYearUnavailable, "Disponible solo para años añadidos con seguimiento mensual en Gridly.");
  assert.equal(english.Nav.historicalYearUnavailable, "Available only for years added with monthly tracking in Gridly.");
});
```

- [ ] **Step 2: Run navigation tests to verify failure**

Run: `rtk npm test -- src/components/layout/nav-selectors.test.ts`  
Expected: FAIL.

- [ ] **Step 3: Update AppShell prop type**

In `src/components/layout/app-shell.tsx`, import `YearOption` and update `years`:

```tsx
import type { YearOption } from "@/lib/types";

interface Props {
  currentYear: number;
  currentMonth: number | null;
  view: "overview" | "summary" | "settings" | "evolution";
  years: number[] | YearOption[];
  user: {
    email?: string | null;
    name?: string | null;
    image?: string | null;
  };
  onMonthViewSelect?: () => void;
  onSummaryViewSelect?: () => void;
  onSettingsSelect?: () => void;
  children: React.ReactNode;
}
```

- [ ] **Step 4: Update NavSelectors to normalize options**

In `src/components/layout/nav-selectors.tsx`, import helpers and type:

```tsx
import type { YearOption } from "@/lib/types";
import { getGridlyYears, getNextCreatableYearFromOptions } from "@/lib/server/year-navigation";
```

Update `years` prop to `number[] | YearOption[]` and normalize:

```tsx
const yearOptions: YearOption[] = years.map((entry) =>
  typeof entry === "number" ? { year: entry, source: "gridly" } : entry
);
const gridlyYears = getGridlyYears(yearOptions);
const selectedYearOption = yearOptions.find((option) => option.year === currentYear);
const isHistoricalYearSelected = selectedYearOption?.source === "historical";
const evolutionYears = yearOptions.filter((option) => option.year <= calendarYear);
const showCurrentYearMarker = yearOptions.length > 1;
const nextCreatableYear = getNextCreatableYearFromOptions(yearOptions, currentYear);
```

Change year selector rendering to iterate `yearOptions`, and build month/summary hrefs from `currentYear` only when `!isHistoricalYearSelected`.

Set tab disabled states:

```tsx
const mainTabs = [
  { label: t("months"), key: "overview" as const, href: monthHref, disabled: isHistoricalYearSelected, disabledTitle: t("historicalYearUnavailable") },
  { label: t("annualSummary"), key: "summary" as const, href: summaryHref, disabled: isHistoricalYearSelected, disabledTitle: t("historicalYearUnavailable") },
  { label: t("evolution"), key: "evolution" as const, href: evolutionHref, disabled: evolutionYears.length < 2, disabledTitle: t("evolutionUnavailable") },
];
```

For disabled tabs, use `title={tab.disabledTitle}`.

- [ ] **Step 5: Handle year changes for historical years**

In `handleYearChange`, route historical selections to Evolution:

```tsx
const option = yearOptions.find((candidate) => candidate.year === y);
if (option?.source === "historical") {
  router.push(buildEvolutionHref(undefined));
  return;
}
```

For full years, preserve existing summary/month routing.

- [ ] **Step 6: Add nav messages**

In `messages/es.json` under `Nav`:

```json
"historicalYearUnavailable": "Disponible solo para años añadidos con seguimiento mensual en Gridly."
```

In `messages/en.json`:

```json
"historicalYearUnavailable": "Available only for years added with monthly tracking in Gridly."
```

- [ ] **Step 7: Run navigation tests**

Run: `rtk npm test -- src/components/layout/nav-selectors.test.ts`  
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
rtk git add src/components/layout/app-shell.tsx src/components/layout/nav-selectors.tsx src/components/layout/nav-selectors.test.ts messages/es.json messages/en.json
rtk git commit -m "feat: support historical years in navigation"
```

---

### Task 8: Documentation And Full Verification

**Files:**
- Create: `docs/features/historical-year-imports.md`
- Modify: `docs/features/evolution-dashboard.md`
- Modify: `AGENTS.md`

- [ ] **Step 1: Write docs source test**

Add to `src/components/layout/nav-selectors.test.ts` or create `src/lib/historical-years-docs.test.ts`:

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("feature docs describe historical year import limitations", () => {
  const agents = readFileSync(new URL("../../AGENTS.md", import.meta.url), "utf8");
  const docs = readFileSync(new URL("../../docs/features/historical-year-imports.md", import.meta.url), "utf8");
  const evolutionDocs = readFileSync(new URL("../../docs/features/evolution-dashboard.md", import.meta.url), "utf8");

  assert.match(agents, /docs\/features\/historical-year-imports\.md/);
  assert.match(docs, /summary-only historical imports/);
  assert.match(docs, /before the earliest full Gridly year/);
  assert.match(docs, /do not create months/);
  assert.match(evolutionDocs, /historical imports/);
});
```

- [ ] **Step 2: Run docs test to verify failure**

Run: `rtk npm test -- src/lib/historical-years-docs.test.ts`  
Expected: FAIL because the docs do not exist yet.

- [ ] **Step 3: Add feature documentation**

Create `docs/features/historical-year-imports.md`:

```md
# Feature: Historical Year Imports

Historical year imports are summary-only historical records used by the Evolution dashboard. They let users represent years tracked outside Gridly without creating annual configuration, monthly rows, recurring expenses, exports, or balance carry-over links.

## Eligibility

Imports are allowed only when the user already has at least one full Gridly year. The imported year must be before the earliest full Gridly year, must not overlap a full Gridly year, and must not duplicate another historical import for the same user.

## Stored Fields

Historical imports store `year`, `startingBalance`, `finalBalance`, and `investedAmount`. `savedAmount` is derived as `finalBalance - startingBalance`, so negative savings are valid. `investedAmount` must be zero or greater.

## Evolution Behavior

Evolution merges historical imports and full Gridly years in chronological order. Historical rows contribute to final balance, saved amount, invested amount, accumulated invested amount, total saved, and total wealth. Historical rows do not have monthly income, monthly expenses, or savings-rate data, so those fields are shown as unavailable.

## Non-Effects

Historical imports do not create months, recurring expenses, setup configuration, annual exports, or carry-over propagation. Editing or deleting a historical import only changes Evolution history.
```

- [ ] **Step 4: Update Evolution dashboard docs**

In `docs/features/evolution-dashboard.md`, add a section:

```md
## Historical Imports

Evolution can include both full Gridly years and summary-only historical imports. Historical imports are limited to years before the earliest full Gridly year and are intended for pre-Gridly history. They provide starting balance, final balance, and invested amount, while income, expenses, and savings rate remain unavailable.
```

- [ ] **Step 5: Link docs from AGENTS.md**

Add this bullet to the Feature Documentation list:

```md
- [Historical Year Imports](docs/features/historical-year-imports.md): Summary-only pre-Gridly annual imports used by Evolution.
```

- [ ] **Step 6: Run docs test**

Run: `rtk npm test -- src/lib/historical-years-docs.test.ts`  
Expected: PASS.

- [ ] **Step 7: Run full verification**

Run:

```bash
rtk npm test
rtk npm run lint
rtk npm run build
```

Expected:
- `npm test`: all Node tests pass.
- `npm run lint`: no ESLint errors.
- `npm run build`: Next.js production build completes.

- [ ] **Step 8: Commit**

```bash
rtk git add docs/features/historical-year-imports.md docs/features/evolution-dashboard.md AGENTS.md src/lib/historical-years-docs.test.ts
rtk git commit -m "docs: document historical year imports"
```

---

## Final Manual Checks

- [ ] Start the app with `rtk npm run dev`.
- [ ] Sign in with a test account that has at least one full Gridly year.
- [ ] Open `/evolution` and confirm `Añadir año histórico` appears.
- [ ] Add a year before the earliest full Gridly year and confirm the row appears in charts and the detail table.
- [ ] Try adding a year equal to the earliest Gridly year and confirm the localized validation error appears.
- [ ] Edit the historical row and confirm totals refresh after submit.
- [ ] Delete the historical row and confirm only the historical row disappears.
- [ ] Confirm no `months`, recurring expense, setup, export, or carry-over behavior is created or triggered for historical imports.
- [ ] Switch locale and confirm Spanish and English copy both render.

## Self-Review Notes

- Spec coverage: data model, eligibility, Evolution data flow, UI, navigation behavior, API persistence, i18n, docs, testing, and rollout order are all represented by tasks.
- Placeholder scan: no forbidden placeholder language remains; every task includes concrete file paths, commands, and expected results.
- Type consistency: `HistoricalYear`, `HistoricalYearInput`, `YearOption`, `EvolutionMetricSource`, and `EvolutionYearMetric.source` are introduced before downstream tasks use them.
