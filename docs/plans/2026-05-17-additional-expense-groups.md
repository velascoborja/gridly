# Additional Expense Groups Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow users to group related additional expenses within a month into named, collapsible groups that show a combined total when collapsed.

**Architecture:** A new `additionalEntryGroups` DB table holds group metadata (id, monthId, label). `additionalEntries` gains a nullable `groupId` FK — null means ungrouped. The data layer (`year-data.ts`) splits expenses into ungrouped (`additionalExpenses`) and grouped (`additionalExpenseGroups`). A new `AdditionalEntryGroupRow` component owns collapsed/expanded state and entry management within a group; `AdditionalEntriesCard` orchestrates groups + ungrouped entries together. No test suite exists — verify each task with `npm run build && npm run lint`.

**Tech Stack:** Next.js 16 App Router, Drizzle ORM, Neon Postgres, React 19, TypeScript, Tailwind CSS v4, shadcn/ui, next-intl.

**Spec:** `docs/specs/2026-05-17-additional-expense-groups-design.md`

---

## File Map

| File | Change |
|---|---|
| `src/db/schema.ts` | New `additionalEntryGroups` table; add `groupId` FK to `additionalEntries` |
| `src/lib/types.ts` | New `AdditionalEntryGroup` interface; update `MonthData` |
| `src/lib/calculations.ts` | Update `RawMonthData`, `totalExpenses`, `estimatedMonthData` to include groups |
| `src/lib/additional-entries.ts` | Update `avgAdditionalEntriesPerMonth` to include grouped entries |
| `src/lib/server/year-data.ts` | Load groups from DB; split ungrouped vs grouped expenses |
| `src/app/api/months/[monthId]/entries/[entryId]/route.ts` | Add `groupId` to entry PATCH |
| `src/app/api/months/[monthId]/entry-groups/route.ts` | **New** — POST create group |
| `src/app/api/months/[monthId]/entry-groups/[groupId]/route.ts` | **New** — PATCH rename, DELETE |
| `messages/es.json` | Add group i18n strings |
| `messages/en.json` | Add group i18n strings |
| `src/components/monthly/additional-entry-group-row.tsx` | **New** — group row component |
| `src/components/monthly/additional-entries-card.tsx` | Add groups prop, "Añadir grupo" button, group dropdown in edit forms |
| `src/components/monthly/month-overview.tsx` | Wire groups and onGroupsChange |
| `docs/features/additional-entries.md` | Document groups feature |

---

## Task 1: DB Schema

**Files:**
- Modify: `src/db/schema.ts`

- [ ] **Step 1: Add `additionalEntryGroups` table and `groupId` FK to `additionalEntries`**

  Open `src/db/schema.ts`. Insert the new table **before** the `additionalEntries` table definition (the FK goes from `additionalEntries` → `additionalEntryGroups`, so it must be defined first). Then add `groupId` to `additionalEntries`.

  Replace the existing `additionalEntries` table block:

  ```ts
  export const additionalEntryGroups = pgTable("additional_entry_groups", {
    id: serial("id").primaryKey(),
    monthId: integer("month_id")
      .notNull()
      .references(() => months.id, { onDelete: "cascade" }),
    label: text("label").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
  });

  export const additionalEntries = pgTable("additional_entries", {
    id: serial("id").primaryKey(),
    monthId: integer("month_id")
      .notNull()
      .references(() => months.id, { onDelete: "cascade" }),
    groupId: integer("group_id")
      .references(() => additionalEntryGroups.id, { onDelete: "cascade" }),
    type: text("type").notNull(), // 'income' | 'expense'
    label: text("label").notNull(),
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull().default("0"),
    createdAt: timestamp("created_at").defaultNow(),
  });
  ```

- [ ] **Step 2: Run the migration**

  ```bash
  npx drizzle-kit push
  ```

  Expected: Drizzle detects the new table and the new nullable column, applies both with no data loss. Confirm at the prompt.

- [ ] **Step 3: Verify build still passes**

  ```bash
  npm run build
  ```

  Expected: No TypeScript errors. (Drizzle will now infer the `groupId` field on all `additionalEntries` queries automatically.)

- [ ] **Step 4: Commit**

  ```bash
  git add src/db/schema.ts
  git commit -m "feat(db): add additionalEntryGroups table and groupId FK on additionalEntries"
  ```

---

## Task 2: TypeScript Types

**Files:**
- Modify: `src/lib/types.ts`

- [ ] **Step 1: Add `AdditionalEntryGroup` and update `MonthData`**

  In `src/lib/types.ts`, add the new interface after `AdditionalEntry` and update `MonthData`:

  ```ts
  export interface AdditionalEntryGroup {
    id: number;
    monthId: number;
    label: string;
    entries: AdditionalEntry[];
  }
  ```

  In `MonthData`, add one field alongside `additionalExpenses`:

  ```ts
  additionalExpenseGroups: AdditionalEntryGroup[];
  ```

  Full updated `MonthData` (add the new field — do not remove any existing fields):

  ```ts
  export interface MonthData {
    id: number;
    yearId: number;
    month: number;
    homeExpense: number;
    homeExpenseManualOverride: boolean;
    personalExpense: number;
    personalExpenseManualOverride: boolean;
    investment: number;
    investmentManualOverride: boolean;
    payslip: number;
    payslipManualOverride: boolean;
    additionalPayslip: number;
    additionalPayslipManualOverride: boolean;
    interests: number;
    interestsManualOverride: boolean;
    personalRemaining: number;
    recurringExpenses: RecurringExpense[];
    additionalExpenses: AdditionalEntry[];       // ungrouped expenses only
    additionalExpenseGroups: AdditionalEntryGroup[]; // grouped expenses
    additionalIncomes: AdditionalEntry[];
    // computed
    totalIncome: number;
    totalExpenses: number;
    savings: number;
    startingBalance: number;
    endingBalance: number;
  }
  ```

- [ ] **Step 2: Verify build**

  ```bash
  npm run build
  ```

  Expected: TypeScript errors on files that use `MonthData` — these will be fixed in subsequent tasks. This is expected for now; the errors tell you which files need updating.

- [ ] **Step 3: Commit**

  ```bash
  git add src/lib/types.ts
  git commit -m "feat(types): add AdditionalEntryGroup interface and additionalExpenseGroups to MonthData"
  ```

---

## Task 3: Calculations

**Files:**
- Modify: `src/lib/calculations.ts`
- Modify: `src/lib/additional-entries.ts`

- [ ] **Step 1: Update `RawMonthData` in `calculations.ts`**

  `RawMonthData` is a local interface (not exported) inside `src/lib/calculations.ts`. Add the import for `AdditionalEntryGroup` and add `additionalExpenseGroups` to the interface. Also add it to `estimatedMonthData`.

  At the top of `calculations.ts`, update the import:

  ```ts
  import type { AdditionalEntry, AdditionalEntryGroup, MonthData, RecurringExpense, YearConfig } from "./types";
  ```

  Update `RawMonthData`:

  ```ts
  interface RawMonthData {
    id: number;
    yearId: number;
    month: number;
    homeExpense: number;
    homeExpenseManualOverride?: boolean;
    personalExpense: number;
    personalExpenseManualOverride?: boolean;
    investment: number;
    investmentManualOverride?: boolean;
    payslip: number;
    payslipManualOverride?: boolean;
    additionalPayslip: number;
    additionalPayslipManualOverride?: boolean;
    interests: number;
    interestsManualOverride: boolean;
    personalRemaining: number;
    recurringExpenses?: RecurringExpense[];
    additionalExpenses: AdditionalEntry[];       // ungrouped only
    additionalExpenseGroups: AdditionalEntryGroup[]; // grouped
    additionalIncomes: AdditionalEntry[];
  }
  ```

- [ ] **Step 2: Update `totalExpenses` to include grouped entries**

  Replace the existing `totalExpenses` function:

  ```ts
  export function totalExpenses(m: RawMonthData): number {
    const additionalSum = m.additionalExpenses.reduce((sum, e) => sum + e.amount, 0);
    const groupedSum = m.additionalExpenseGroups.reduce(
      (sum, g) => sum + g.entries.reduce((s, e) => s + e.amount, 0),
      0
    );
    const recurringSum = (m.recurringExpenses ?? []).reduce((sum, e) => sum + e.amount, 0);
    return m.homeExpense + m.personalExpense + m.investment + recurringSum + additionalSum + groupedSum;
  }
  ```

- [ ] **Step 3: Update `estimatedMonthData` to include empty groups**

  In `estimatedMonthData`, add `additionalExpenseGroups: []` alongside `additionalExpenses: []`:

  ```ts
  export function estimatedMonthData(month: number, config: YearConfig): Omit<RawMonthData, "id" | "yearId"> {
    const isExtraPaymentMonth = month === 6 || month === 12;

    return {
      month,
      homeExpense: config.monthlyHomeExpense,
      homeExpenseManualOverride: false,
      personalExpense: config.monthlyPersonalBudget,
      personalExpenseManualOverride: false,
      investment: config.monthlyInvestment,
      investmentManualOverride: false,
      payslip: config.estimatedSalary,
      payslipManualOverride: false,
      additionalPayslip: config.hasExtraPayments && isExtraPaymentMonth ? config.estimatedExtraPayment : 0,
      additionalPayslipManualOverride: false,
      interests: 0,
      interestsManualOverride: false,
      personalRemaining: 0,
      recurringExpenses: [],
      additionalExpenses: [],
      additionalExpenseGroups: [],
      additionalIncomes: [],
    };
  }
  ```

- [ ] **Step 4: Update `avgAdditionalEntriesPerMonth` in `additional-entries.ts`**

  The function currently only sums ungrouped entries. Update it to also count grouped entries when `type === "expense"`.

  Replace the entire file `src/lib/additional-entries.ts`:

  ```ts
  import type { AdditionalEntry, MonthData } from "@/lib/types";

  export function sortAdditionalEntriesDesc(entries: AdditionalEntry[]) {
    return [...entries].sort((a, b) => {
      const amountDiff = b.amount - a.amount;
      return amountDiff !== 0 ? amountDiff : b.id - a.id;
    });
  }

  export function sumAdditionalEntries(entries: AdditionalEntry[]) {
    return entries.reduce((sum, entry) => sum + entry.amount, 0);
  }

  export function avgAdditionalEntriesPerMonth(
    months: MonthData[],
    type: "expense" | "income"
  ): number {
    const total = months.reduce((sum, m) => {
      if (type === "income") {
        return sum + sumAdditionalEntries(m.additionalIncomes);
      }
      const ungrouped = sumAdditionalEntries(m.additionalExpenses);
      const grouped = m.additionalExpenseGroups.reduce(
        (s, g) => s + sumAdditionalEntries(g.entries),
        0
      );
      return sum + ungrouped + grouped;
    }, 0);
    return total / 12;
  }
  ```

- [ ] **Step 5: Verify build**

  ```bash
  npm run build
  ```

  Expected: Errors only in `year-data.ts` (not yet providing `additionalExpenseGroups` in the raw month shape). No errors in `calculations.ts` or `additional-entries.ts`.

- [ ] **Step 6: Commit**

  ```bash
  git add src/lib/calculations.ts src/lib/additional-entries.ts
  git commit -m "feat(calc): include grouped expenses in totalExpenses and yearly averages"
  ```

---

## Task 4: Data Loading

**Files:**
- Modify: `src/lib/server/year-data.ts`

This is where all month data is assembled from the DB and passed to `computeMonthChain`. We need to:
1. Load all groups for the relevant months.
2. Split expenses into ungrouped (`groupId IS NULL`) and grouped (assigned to a group).

- [ ] **Step 1: Add import for `additionalEntryGroups`**

  At the top of `src/lib/server/year-data.ts`, update the schema import:

  ```ts
  import { additionalEntries, additionalEntryGroups, monthlyRecurringExpenses, months, yearRecurringExpenses, years } from "@/db/schema";
  ```

  Also update the types import to include `AdditionalEntryGroup`:

  ```ts
  import type { AdditionalEntryGroup, YearData } from "@/lib/types";
  ```

- [ ] **Step 2: Load groups from DB in `getYearData`**

  After the existing `allEntries` query (around line 32), add a query for groups:

  ```ts
  const allGroups =
    monthRows.length > 0
      ? await db
          .select()
          .from(additionalEntryGroups)
          .where(inArray(additionalEntryGroups.monthId, monthRows.map((month) => month.id)))
      : [];
  ```

  Then build a `groupsByMonthId` map (just like `entriesByMonthId`):

  ```ts
  const groupsByMonthId = new Map<number, typeof allGroups>();
  for (const group of allGroups) {
    if (!groupsByMonthId.has(group.monthId)) groupsByMonthId.set(group.monthId, []);
    groupsByMonthId.get(group.monthId)!.push(group);
  }
  ```

- [ ] **Step 3: Split entries into ungrouped and grouped in the `rawMonths` map**

  In the `rawMonths` map block (inside `monthRows.map((month) => { ... })`), replace the `additionalExpenses` calculation with separate ungrouped + grouped logic:

  ```ts
  const entries = entriesByMonthId.get(month.id) ?? [];
  const groups = groupsByMonthId.get(month.id) ?? [];
  const recurringExpenses = recurringExpensesByMonthId.get(month.id) ?? [];

  const expenseEntries = entries.filter((e) => e.type === "expense");

  const additionalExpenseGroups: AdditionalEntryGroup[] = groups.map((group) => ({
    id: group.id,
    monthId: group.monthId,
    label: group.label,
    entries: sortAdditionalEntriesDesc(
      expenseEntries
        .filter((e) => e.groupId === group.id)
        .map((e) => ({
          id: e.id,
          monthId: e.monthId,
          type: "expense" as const,
          label: e.label,
          amount: parseFloat(e.amount),
        }))
    ),
  }));

  const groupedEntryIds = new Set(
    additionalExpenseGroups.flatMap((g) => g.entries.map((e) => e.id))
  );

  return {
    // ... all existing fields ...
    additionalExpenses: sortAdditionalEntriesDesc(
      expenseEntries
        .filter((e) => !groupedEntryIds.has(e.id))
        .map((e) => ({
          id: e.id,
          monthId: e.monthId,
          type: "expense" as const,
          label: e.label,
          amount: parseFloat(e.amount),
        }))
    ),
    additionalExpenseGroups,
    additionalIncomes: sortAdditionalEntriesDesc(
      entries
        .filter((e) => e.type === "income")
        .map((e) => ({
          id: e.id,
          monthId: e.monthId,
          type: "income" as const,
          label: e.label,
          amount: parseFloat(e.amount),
        }))
    ),
  };
  ```

  The full updated `rawMonths` block for reference — keep all existing numeric fields, just replace the entries section:

  ```ts
  const rawMonths = monthRows.map((month) => {
    const entries = entriesByMonthId.get(month.id) ?? [];
    const groups = groupsByMonthId.get(month.id) ?? [];
    const recurringExpenses = recurringExpensesByMonthId.get(month.id) ?? [];

    const expenseEntries = entries.filter((e) => e.type === "expense");

    const additionalExpenseGroups: AdditionalEntryGroup[] = groups.map((group) => ({
      id: group.id,
      monthId: group.monthId,
      label: group.label,
      entries: sortAdditionalEntriesDesc(
        expenseEntries
          .filter((e) => e.groupId === group.id)
          .map((e) => ({
            id: e.id,
            monthId: e.monthId,
            type: "expense" as const,
            label: e.label,
            amount: parseFloat(e.amount),
          }))
      ),
    }));

    const groupedEntryIds = new Set(
      additionalExpenseGroups.flatMap((g) => g.entries.map((e) => e.id))
    );

    return {
      id: month.id,
      yearId: month.yearId,
      month: month.month,
      homeExpense: parseFloat(month.homeExpense),
      homeExpenseManualOverride: month.homeExpenseManualOverride,
      personalExpense: parseFloat(month.personalExpense),
      personalExpenseManualOverride: month.personalExpenseManualOverride,
      investment: parseFloat(month.investment),
      investmentManualOverride: month.investmentManualOverride,
      payslip: parseFloat(month.payslip),
      payslipManualOverride: month.payslipManualOverride,
      additionalPayslip: parseFloat(month.additionalPayslip),
      additionalPayslipManualOverride: month.additionalPayslipManualOverride,
      interests: parseFloat(month.interests),
      interestsManualOverride: month.interestsManualOverride,
      personalRemaining: parseFloat(month.personalRemaining),
      recurringExpenses: sortRecurringExpensesAsc(recurringExpenses.map(parseMonthlyRecurringExpense)),
      additionalExpenses: sortAdditionalEntriesDesc(
        expenseEntries
          .filter((e) => !groupedEntryIds.has(e.id))
          .map((e) => ({
            id: e.id,
            monthId: e.monthId,
            type: "expense" as const,
            label: e.label,
            amount: parseFloat(e.amount),
          }))
      ),
      additionalExpenseGroups,
      additionalIncomes: sortAdditionalEntriesDesc(
        entries
          .filter((e) => e.type === "income")
          .map((e) => ({
            id: e.id,
            monthId: e.monthId,
            type: "income" as const,
            label: e.label,
            amount: parseFloat(e.amount),
          }))
      ),
    };
  });
  ```

- [ ] **Step 4: Verify build**

  ```bash
  npm run build
  ```

  Expected: The `year-data.ts` errors clear. Remaining errors will be in `month-overview.tsx` (needs groups prop) and `additional-entries-card.tsx` (not yet).

- [ ] **Step 5: Commit**

  ```bash
  git add src/lib/server/year-data.ts
  git commit -m "feat(data): load additionalExpenseGroups in getYearData"
  ```

---

## Task 5: Entry PATCH — add `groupId`

**Files:**
- Modify: `src/app/api/months/[monthId]/entries/[entryId]/route.ts`

- [ ] **Step 1: Add `groupId` handling to the PATCH handler**

  In the PATCH handler, add `groupId` parsing after the existing `label`/`amount` updates. Also import `additionalEntryGroups` and `and`/`eq` helpers. The full updated PATCH handler:

  ```ts
  import { db } from "@/db";
  import { additionalEntries, additionalEntryGroups } from "@/db/schema";
  import { and, eq } from "drizzle-orm";
  import { getYearNumberForYearId, propagateYearCarryOver } from "@/lib/server/year-carry-over";
  import { getSessionUser } from "@/lib/server/session";
  import { getOwnedEntry, getOwnedMonth } from "@/lib/server/ownership";

  export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ monthId: string; entryId: string }> }
  ) {
    const user = await getSessionUser();
    if (!user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { monthId, entryId } = await params;
    const month = await getOwnedMonth(user.id, parseInt(monthId, 10));
    const id = parseInt(entryId, 10);
    const body = await request.json();

    const updates: Partial<typeof additionalEntries.$inferInsert> = {};
    if (body.label !== undefined) updates.label = body.label;
    if (body.amount !== undefined) updates.amount = String(body.amount);

    const entry = await getOwnedEntry(user.id, id);
    if (!month || !entry || entry.monthId !== month.id)
      return Response.json({ error: "Entry not found" }, { status: 404 });

    if (body.monthId !== undefined) {
      const targetMonthId = parseInt(String(body.monthId), 10);
      if (Number.isNaN(targetMonthId)) {
        return Response.json({ error: "Invalid target month" }, { status: 400 });
      }
      const targetMonth = await getOwnedMonth(user.id, targetMonthId);
      if (!targetMonth) {
        return Response.json({ error: "Target month not found" }, { status: 404 });
      }
      if (targetMonth.yearId !== month.yearId) {
        return Response.json({ error: "Target month must be in the same year" }, { status: 400 });
      }
      updates.monthId = targetMonth.id;
    }

    if (body.groupId !== undefined) {
      if (body.groupId === null) {
        updates.groupId = null;
      } else {
        const groupId = parseInt(String(body.groupId), 10);
        if (Number.isNaN(groupId)) {
          return Response.json({ error: "Invalid groupId" }, { status: 400 });
        }
        const group = await db.query.additionalEntryGroups.findFirst({
          where: and(
            eq(additionalEntryGroups.id, groupId),
            eq(additionalEntryGroups.monthId, month.id)
          ),
        });
        if (!group) {
          return Response.json({ error: "Group not found" }, { status: 404 });
        }
        updates.groupId = groupId;
      }
    }

    const [updated] = await db
      .update(additionalEntries)
      .set(updates)
      .where(eq(additionalEntries.id, entry.id))
      .returning();

    const yearNumber = await getYearNumberForYearId(month.yearId);
    if (yearNumber !== null) {
      await propagateYearCarryOver(user.id, yearNumber);
    }

    return Response.json(updated);
  }
  ```

  Keep the existing `DELETE` handler unchanged below it.

- [ ] **Step 2: Verify build**

  ```bash
  npm run build
  ```

  Expected: No new errors.

- [ ] **Step 3: Commit**

  ```bash
  git add "src/app/api/months/[monthId]/entries/[entryId]/route.ts"
  git commit -m "feat(api): support groupId in entry PATCH"
  ```

---

## Task 6: Group API Routes

**Files:**
- Create: `src/app/api/months/[monthId]/entry-groups/route.ts`
- Create: `src/app/api/months/[monthId]/entry-groups/[groupId]/route.ts`

- [ ] **Step 1: Create POST route for creating a group**

  Create `src/app/api/months/[monthId]/entry-groups/route.ts`:

  ```ts
  import { db } from "@/db";
  import { additionalEntryGroups } from "@/db/schema";
  import { getSessionUser } from "@/lib/server/session";
  import { getOwnedMonth } from "@/lib/server/ownership";

  export async function POST(
    request: Request,
    { params }: { params: Promise<{ monthId: string }> }
  ) {
    const user = await getSessionUser();
    if (!user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { monthId } = await params;
    const month = await getOwnedMonth(user.id, parseInt(monthId, 10));
    if (!month) return Response.json({ error: "Month not found" }, { status: 404 });

    const body = await request.json();
    const label = typeof body.label === "string" ? body.label.trim() : "";
    if (!label) {
      return Response.json({ error: "label is required" }, { status: 400 });
    }

    const [group] = await db
      .insert(additionalEntryGroups)
      .values({ monthId: month.id, label })
      .returning();

    return Response.json(group, { status: 201 });
  }
  ```

- [ ] **Step 2: Create PATCH and DELETE routes for a specific group**

  Create `src/app/api/months/[monthId]/entry-groups/[groupId]/route.ts`:

  ```ts
  import { db } from "@/db";
  import { additionalEntryGroups } from "@/db/schema";
  import { and, eq } from "drizzle-orm";
  import { getSessionUser } from "@/lib/server/session";
  import { getOwnedMonth } from "@/lib/server/ownership";

  async function getOwnedGroup(userId: string, monthId: number, groupId: number) {
    const month = await getOwnedMonth(userId, monthId);
    if (!month) return null;
    const group = await db.query.additionalEntryGroups.findFirst({
      where: and(
        eq(additionalEntryGroups.id, groupId),
        eq(additionalEntryGroups.monthId, month.id)
      ),
    });
    return group ?? null;
  }

  export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ monthId: string; groupId: string }> }
  ) {
    const user = await getSessionUser();
    if (!user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { monthId, groupId } = await params;
    const group = await getOwnedGroup(
      user.id,
      parseInt(monthId, 10),
      parseInt(groupId, 10)
    );
    if (!group) return Response.json({ error: "Group not found" }, { status: 404 });

    const body = await request.json();
    const label = typeof body.label === "string" ? body.label.trim() : "";
    if (!label) {
      return Response.json({ error: "label is required" }, { status: 400 });
    }

    const [updated] = await db
      .update(additionalEntryGroups)
      .set({ label })
      .where(eq(additionalEntryGroups.id, group.id))
      .returning();

    return Response.json(updated);
  }

  export async function DELETE(
    _req: Request,
    { params }: { params: Promise<{ monthId: string; groupId: string }> }
  ) {
    const user = await getSessionUser();
    if (!user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { monthId, groupId } = await params;
    const group = await getOwnedGroup(
      user.id,
      parseInt(monthId, 10),
      parseInt(groupId, 10)
    );
    if (!group) return Response.json({ error: "Group not found" }, { status: 404 });

    await db
      .delete(additionalEntryGroups)
      .where(eq(additionalEntryGroups.id, group.id));

    return new Response(null, { status: 204 });
  }
  ```

- [ ] **Step 3: Verify build**

  ```bash
  npm run build
  ```

  Expected: No errors in the new route files.

- [ ] **Step 4: Commit**

  ```bash
  git add "src/app/api/months/[monthId]/entry-groups"
  git commit -m "feat(api): add entry-groups CRUD routes (POST, PATCH, DELETE)"
  ```

---

## Task 7: i18n Strings

**Files:**
- Modify: `messages/es.json`
- Modify: `messages/en.json`

- [ ] **Step 1: Add Spanish strings**

  In `messages/es.json`, find `"Monthly"` → `"additionalEntries"` and add the following keys:

  ```json
  "addGroup": "Añadir grupo",
  "groupNamePlaceholder": "Nombre del grupo",
  "addingGroup": "Añadiendo...",
  "addToGroup": "Añadir al grupo",
  "noGroup": "Sin grupo",
  "group": "Grupo",
  "confirmDeleteGroupTitle": "¿Eliminar grupo?",
  "confirmDeleteGroupDescription": "Se eliminará el grupo \"{label}\" y sus {count} gastos. Esta acción no se puede deshacer.",
  "confirmDeleteGroupAction": "Eliminar grupo",
  "deletingGroup": "Eliminando...",
  "savingGroup": "Guardando..."
  ```

- [ ] **Step 2: Add English strings**

  In `messages/en.json`, find `"Monthly"` → `"additionalEntries"` and add:

  ```json
  "addGroup": "Add group",
  "groupNamePlaceholder": "Group name",
  "addingGroup": "Adding...",
  "addToGroup": "Add to group",
  "noGroup": "No group",
  "group": "Group",
  "confirmDeleteGroupTitle": "Delete group?",
  "confirmDeleteGroupDescription": "Group \"{label}\" and its {count} expenses will be deleted. This action cannot be undone.",
  "confirmDeleteGroupAction": "Delete group",
  "deletingGroup": "Deleting...",
  "savingGroup": "Saving..."
  ```

- [ ] **Step 3: Commit**

  ```bash
  git add messages/es.json messages/en.json
  git commit -m "feat(i18n): add group strings to additionalEntries namespace"
  ```

---

## Task 8: `AdditionalEntryGroupRow` Component

**Files:**
- Create: `src/components/monthly/additional-entry-group-row.tsx`

This component owns all UI state for a single group: collapsed/expanded, inline group rename, add-entry form, per-entry edit/delete. It calls parent callbacks for state changes that affect the card-level data.

- [ ] **Step 1: Create the component**

  Create `src/components/monthly/additional-entry-group-row.tsx`:

  ```tsx
  "use client";

  import { useState } from "react";
  import { useLocale, useTranslations } from "next-intl";
  import { ChevronRight, Loader2, Plus, Trash2 } from "lucide-react";
  import { Button } from "@/components/ui/button";
  import { Input } from "@/components/ui/input";
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
  import { sortAdditionalEntriesDesc } from "@/lib/additional-entries";
  import { sanitizeNumericInput } from "@/lib/currency-input";
  import { cn, formatCurrency } from "@/lib/utils";
  import type { AdditionalEntry, AdditionalEntryGroup } from "@/lib/types";

  interface Props {
    monthId: number;
    group: AdditionalEntryGroup;
    allGroups: AdditionalEntryGroup[];
    onGroupUpdate: (group: AdditionalEntryGroup) => void;
    onGroupDelete: (groupId: number) => void;
    onEntryGroupChanged: (entry: AdditionalEntry, toGroupId: number | null) => void;
    readOnly?: boolean;
  }

  export function AdditionalEntryGroupRow({
    monthId,
    group,
    allGroups,
    onGroupUpdate,
    onGroupDelete,
    onEntryGroupChanged,
    readOnly = false,
  }: Props) {
    const t = useTranslations("Monthly.additionalEntries");
    const common = useTranslations("Common");
    const locale = useLocale();

    const [collapsed, setCollapsed] = useState(true);
    const [isEditingName, setIsEditingName] = useState(false);
    const [nameValue, setNameValue] = useState(group.label);
    const [isSavingName, setIsSavingName] = useState(false);
    const [isDeletingGroup, setIsDeletingGroup] = useState(false);

    const [addingFormOpen, setAddingFormOpen] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const [newLabel, setNewLabel] = useState("");
    const [newAmount, setNewAmount] = useState("");

    const [editingId, setEditingId] = useState<number | null>(null);
    const [editLabel, setEditLabel] = useState("");
    const [editAmount, setEditAmount] = useState("");
    const [editGroupId, setEditGroupId] = useState<number | null | "none">("none");
    const [savingId, setSavingId] = useState<number | null>(null);
    const [deletingId, setDeletingId] = useState<number | null>(null);

    const parseAmount = (v: string) => parseFloat(v.replace(",", "."));

    const groupTotal = group.entries.reduce((sum, e) => sum + e.amount, 0);

    const handleToggle = () => {
      if (!isEditingName) setCollapsed((c) => !c);
    };

    const handleRenameStart = (e: React.MouseEvent) => {
      e.stopPropagation();
      setNameValue(group.label);
      setIsEditingName(true);
    };

    const handleRenameSave = async () => {
      if (isSavingName) return;
      const label = nameValue.trim();
      if (!label || label === group.label) {
        setIsEditingName(false);
        return;
      }
      setIsSavingName(true);
      try {
        const res = await fetch(`/api/months/${monthId}/entry-groups/${group.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ label }),
        });
        if (!res.ok) return;
        onGroupUpdate({ ...group, label });
      } finally {
        setIsSavingName(false);
        setIsEditingName(false);
      }
    };

    const handleDeleteGroup = async () => {
      if (isDeletingGroup) return;
      setIsDeletingGroup(true);
      try {
        const res = await fetch(`/api/months/${monthId}/entry-groups/${group.id}`, {
          method: "DELETE",
        });
        if (!res.ok) return;
        onGroupDelete(group.id);
      } finally {
        setIsDeletingGroup(false);
      }
    };

    const closeAddForm = () => {
      setAddingFormOpen(false);
      setNewLabel("");
      setNewAmount("");
    };

    const handleAdd = async () => {
      if (isAdding) return;
      const amount = parseAmount(newAmount);
      if (!newLabel.trim() || isNaN(amount)) return;
      setIsAdding(true);
      try {
        const res = await fetch(`/api/months/${monthId}/entries`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "expense", label: newLabel.trim(), amount, groupId: group.id }),
        });
        if (!res.ok) return;
        const entry = await res.json();
        const newEntry: AdditionalEntry = { ...entry, amount: parseFloat(entry.amount) };
        onGroupUpdate({
          ...group,
          entries: sortAdditionalEntriesDesc([...group.entries, newEntry]),
        });
        closeAddForm();
      } finally {
        setIsAdding(false);
      }
    };

    const openEditForm = (entry: AdditionalEntry) => {
      setEditingId(entry.id);
      setEditLabel(entry.label);
      setEditAmount(String(entry.amount));
      setEditGroupId(group.id);
    };

    const handleEdit = async (entryId: number) => {
      if (savingId === entryId) return;
      const amount = parseAmount(editAmount);
      if (!editLabel.trim() || isNaN(amount)) return;

      const toGroupId = editGroupId === "none" ? null : editGroupId;
      const groupChanged = toGroupId !== group.id;

      setSavingId(entryId);
      try {
        const body: Record<string, unknown> = { label: editLabel.trim(), amount };
        if (groupChanged) body.groupId = toGroupId;

        const res = await fetch(`/api/months/${monthId}/entries/${entryId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) return;
        const updated = await res.json();
        const updatedEntry: AdditionalEntry = { ...updated, amount: parseFloat(updated.amount) };

        if (groupChanged) {
          onEntryGroupChanged(updatedEntry, toGroupId);
        } else {
          onGroupUpdate({
            ...group,
            entries: sortAdditionalEntriesDesc(
              group.entries.map((e) => (e.id === entryId ? updatedEntry : e))
            ),
          });
        }
        setEditingId(null);
      } finally {
        setSavingId(null);
      }
    };

    const handleDeleteEntry = async (entryId: number) => {
      if (deletingId === entryId) return;
      setDeletingId(entryId);
      try {
        const res = await fetch(`/api/months/${monthId}/entries/${entryId}`, { method: "DELETE" });
        if (!res.ok) return;
        onGroupUpdate({
          ...group,
          entries: sortAdditionalEntriesDesc(group.entries.filter((e) => e.id !== entryId)),
        });
      } finally {
        setDeletingId(null);
      }
    };

    const renderAmountInput = ({
      value,
      onChange,
      disabled,
      onKeyDown,
      placeholder,
    }: {
      value: string;
      onChange: (v: string) => void;
      disabled: boolean;
      onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
      placeholder?: string;
    }) => (
      <div className="relative w-full sm:w-28">
        <Input
          className="h-9 w-full pr-8 text-right text-sm"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(sanitizeNumericInput(e.target.value))}
          disabled={disabled}
          onKeyDown={onKeyDown}
          inputMode="decimal"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground"
        >
          €
        </span>
      </div>
    );

    return (
      <div className="overflow-hidden rounded-xl border border-primary/20 bg-primary/[0.03]">
        {/* Group header */}
        <div
          className={cn(
            "flex cursor-pointer select-none items-center gap-2 px-2.5 py-2",
            !readOnly && "hover:bg-primary/[0.05]"
          )}
          onClick={handleToggle}
        >
          <ChevronRight
            className={cn(
              "h-3.5 w-3.5 shrink-0 text-muted-foreground/60 transition-transform duration-150",
              !collapsed && "rotate-90"
            )}
          />

          {!readOnly && isEditingName ? (
            <Input
              className="h-7 flex-1 text-sm font-semibold"
              value={nameValue}
              autoFocus
              onChange={(e) => setNameValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRenameSave();
                if (e.key === "Escape") setIsEditingName(false);
              }}
              onBlur={handleRenameSave}
              onClick={(e) => e.stopPropagation()}
              disabled={isSavingName}
            />
          ) : (
            <button
              className={cn(
                "flex-1 truncate text-left text-sm font-semibold text-foreground",
                !readOnly && "hover:text-primary transition-colors"
              )}
              onClick={!readOnly ? handleRenameStart : undefined}
              type="button"
              disabled={readOnly}
            >
              {group.label}
            </button>
          )}

          <span className="shrink-0 rounded-full bg-muted/40 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
            {group.entries.length}
          </span>

          <span className="shrink-0 text-sm font-semibold tabular-nums text-rose-600 dark:text-rose-300">
            {formatCurrency(groupTotal, locale)}
          </span>

          {!readOnly && (
            <AlertDialog>
              <AlertDialogTrigger
                render={
                  <Button
                    size="icon-xs"
                    variant="ghost"
                    className="shrink-0 text-muted-foreground hover:text-destructive"
                    aria-label={`${t("delete")} ${group.label}`}
                    disabled={isDeletingGroup}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {isDeletingGroup ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Trash2 className="h-3 w-3" />
                    )}
                  </Button>
                }
              />
              <AlertDialogContent size="sm">
                <AlertDialogHeader>
                  <AlertDialogTitle>{t("confirmDeleteGroupTitle")}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t("confirmDeleteGroupDescription", {
                      label: group.label,
                      count: group.entries.length,
                    })}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel variant="ghost" disabled={isDeletingGroup}>
                    {t("cancel")}
                  </AlertDialogCancel>
                  <AlertDialogAction
                    variant="destructive"
                    onClick={handleDeleteGroup}
                    disabled={isDeletingGroup}
                  >
                    {isDeletingGroup ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : null}
                    {isDeletingGroup ? t("deletingGroup") : t("confirmDeleteGroupAction")}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>

        {/* Expanded body */}
        {!collapsed && (
          <div className="border-t border-primary/10 bg-background/60 px-2 py-1.5 flex flex-col gap-1.5">
            {group.entries.map((entry) =>
              !readOnly && editingId === entry.id ? (
                <div key={entry.id} className="rounded-xl border border-border/70 bg-muted/20 p-1.5">
                  <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_7rem_auto_auto] sm:items-center">
                    <Input
                      className="h-9 min-w-0 text-sm"
                      value={editLabel}
                      onChange={(e) => setEditLabel(e.target.value)}
                      disabled={savingId === entry.id}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleEdit(entry.id);
                        if (e.key === "Escape" && savingId !== entry.id) setEditingId(null);
                      }}
                      autoFocus
                    />
                    {renderAmountInput({
                      value: editAmount,
                      onChange: setEditAmount,
                      disabled: savingId === entry.id,
                      onKeyDown: (e) => {
                        if (e.key === "Enter") handleEdit(entry.id);
                        if (e.key === "Escape" && savingId !== entry.id) setEditingId(null);
                      },
                    })}
                    <select
                      className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                      value={editGroupId === null ? "none" : String(editGroupId)}
                      onChange={(e) =>
                        setEditGroupId(e.target.value === "none" ? null : parseInt(e.target.value, 10))
                      }
                      disabled={savingId === entry.id}
                    >
                      <option value="none">{t("noGroup")}</option>
                      {allGroups.map((g) => (
                        <option key={g.id} value={String(g.id)}>
                          {g.label}
                        </option>
                      ))}
                    </select>
                    <Button
                      size="sm"
                      className="h-9 w-full px-3 sm:w-auto"
                      onClick={() => handleEdit(entry.id)}
                      disabled={savingId === entry.id}
                    >
                      {savingId === entry.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                      {savingId === entry.id ? t("saving") : common("save")}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-9 w-full px-3 sm:w-auto"
                      onClick={() => setEditingId(null)}
                      disabled={savingId === entry.id}
                    >
                      {t("cancel")}
                    </Button>
                  </div>
                </div>
              ) : (
                <div
                  key={entry.id}
                  className={cn(
                    "rounded-lg border border-transparent px-2 py-1.5 transition-all hover:border-border/70 hover:bg-muted/40",
                    (deletingId === entry.id) && "pointer-events-none opacity-60"
                  )}
                >
                  <div className="flex min-w-0 items-center justify-between gap-2">
                    {readOnly ? (
                      <span className="min-w-0 flex-1 truncate text-left text-sm font-medium text-foreground">
                        {entry.label}
                      </span>
                    ) : (
                      <button
                        className="min-w-0 flex-1 truncate text-left text-sm font-medium text-foreground transition-colors hover:text-primary focus-visible:text-primary"
                        onClick={() => openEditForm(entry)}
                        type="button"
                        aria-label={`${t("edit")} ${entry.label}`}
                        disabled={deletingId === entry.id}
                      >
                        {entry.label}
                      </button>
                    )}
                    <div className="flex shrink-0 items-center gap-1.5">
                      {readOnly ? (
                        <span className="whitespace-nowrap text-sm font-semibold tabular-nums">
                          {formatCurrency(entry.amount, locale)}
                        </span>
                      ) : (
                        <button
                          className="whitespace-nowrap rounded-md px-2 py-1 text-sm font-semibold tabular-nums text-foreground transition-colors hover:bg-background hover:text-primary"
                          onClick={() => openEditForm(entry)}
                          type="button"
                          aria-label={`${t("edit")} ${entry.label}`}
                          disabled={deletingId === entry.id}
                        >
                          {formatCurrency(entry.amount, locale)}
                        </button>
                      )}
                      {!readOnly && (
                        <AlertDialog>
                          <AlertDialogTrigger
                            render={
                              <Button
                                size="icon-xs"
                                variant="ghost"
                                className="text-muted-foreground hover:text-destructive"
                                aria-label={`${t("delete")} ${entry.label}`}
                                disabled={deletingId === entry.id}
                              >
                                {deletingId === entry.id ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Trash2 className="h-3 w-3" />
                                )}
                              </Button>
                            }
                          />
                          <AlertDialogContent size="sm">
                            <AlertDialogHeader>
                              <AlertDialogTitle>{t("confirmDeleteTitle")}</AlertDialogTitle>
                              <AlertDialogDescription>
                                {t("confirmDeleteDescription", { label: entry.label })}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel variant="ghost" disabled={deletingId === entry.id}>
                                {t("cancel")}
                              </AlertDialogCancel>
                              <AlertDialogAction
                                variant="destructive"
                                onClick={() => handleDeleteEntry(entry.id)}
                                disabled={deletingId === entry.id}
                              >
                                {deletingId === entry.id ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : null}
                                {deletingId === entry.id ? t("deleting") : t("confirmDeleteAction")}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </div>
                </div>
              )
            )}

            {/* Add entry to group form */}
            {!readOnly && addingFormOpen ? (
              <div className="rounded-xl border border-border/70 bg-muted/20 p-1.5" aria-busy={isAdding}>
                <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_7rem_auto_auto] sm:items-center">
                  <Input
                    className="h-9 min-w-0 text-sm"
                    placeholder={t("descriptionPlaceholder")}
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    disabled={isAdding}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAdd();
                      if (e.key === "Escape" && !isAdding) closeAddForm();
                    }}
                    autoFocus
                  />
                  {renderAmountInput({
                    value: newAmount,
                    onChange: setNewAmount,
                    disabled: isAdding,
                    placeholder: "0.00",
                    onKeyDown: (e) => {
                      if (e.key === "Enter") handleAdd();
                      if (e.key === "Escape" && !isAdding) closeAddForm();
                    },
                  })}
                  <Button
                    size="sm"
                    className="h-9 w-full px-3 sm:w-auto"
                    onClick={handleAdd}
                    disabled={isAdding}
                  >
                    {isAdding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                    {isAdding ? t("adding") : t("add")}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-9 w-full px-3 sm:w-auto"
                    onClick={closeAddForm}
                    disabled={isAdding}
                  >
                    {t("cancel")}
                  </Button>
                </div>
              </div>
            ) : !readOnly ? (
              <button
                className="inline-flex items-center gap-1.5 rounded-md px-1.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
                onClick={() => setAddingFormOpen(true)}
                type="button"
              >
                <Plus className="h-3 w-3" /> {t("addToGroup")}
              </button>
            ) : null}
          </div>
        )}
      </div>
    );
  }
  ```

- [ ] **Step 2: Verify build**

  ```bash
  npm run build
  ```

  Expected: No TypeScript errors in the new component.

- [ ] **Step 3: Commit**

  ```bash
  git add src/components/monthly/additional-entry-group-row.tsx
  git commit -m "feat(ui): add AdditionalEntryGroupRow component"
  ```

---

## Task 9: Update `AdditionalEntriesCard`

**Files:**
- Modify: `src/components/monthly/additional-entries-card.tsx`

Add `groups`/`onGroupsChange` props (expense card only), the "Añadir grupo" button with inline creation form, the group dropdown in ungrouped entry edit forms, and an updated card total that includes grouped entries.

- [ ] **Step 1: Add imports and new props**

  At the top of `src/components/monthly/additional-entries-card.tsx`, add:

  ```tsx
  import { FolderPlus } from "lucide-react";
  import { AdditionalEntryGroupRow } from "./additional-entry-group-row";
  import { sumAdditionalEntries, sortAdditionalEntriesDesc } from "@/lib/additional-entries";
  import type { AdditionalEntry, AdditionalEntryGroup } from "@/lib/types";
  ```

  Update the `Props` interface to add optional group props:

  ```tsx
  interface Props {
    monthId: number;
    type: "income" | "expense";
    entries: AdditionalEntry[];
    onEntriesChange: (entries: AdditionalEntry[]) => void;
    groups?: AdditionalEntryGroup[];
    onGroupsChange?: (groups: AdditionalEntryGroup[]) => void;
    onEntryGroupChanged?: (entry: AdditionalEntry, toGroupId: number | null) => void;
    readOnly?: boolean;
    title: string;
    movingEntryId?: number | null;
    onEntryDragStart?: (entry: AdditionalEntry) => void;
    onEntryDragEnd?: () => void;
  }
  ```

  Update the function signature to destructure the new props with defaults:

  ```tsx
  export function AdditionalEntriesCard({
    monthId,
    type,
    entries,
    onEntriesChange,
    groups = [],
    onGroupsChange,
    onEntryGroupChanged,
    readOnly = false,
    title,
    movingEntryId = null,
    onEntryDragStart,
    onEntryDragEnd,
  }: Props) {
  ```

- [ ] **Step 2: Add group creation state and handlers**

  After the existing state declarations, add:

  ```tsx
  const [addingGroupOpen, setAddingGroupOpen] = useState(false);
  const [isAddingGroup, setIsAddingGroup] = useState(false);
  const [newGroupLabel, setNewGroupLabel] = useState("");
  ```

  Add a handler after `handleEdit`:

  ```tsx
  const handleAddGroup = async () => {
    if (isAddingGroup) return;
    const label = newGroupLabel.trim();
    if (!label) return;
    setIsAddingGroup(true);
    try {
      const res = await fetch(`/api/months/${monthId}/entry-groups`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label }),
      });
      if (!res.ok) return;
      const group = await res.json();
      const newGroup: AdditionalEntryGroup = { id: group.id, monthId: group.monthId, label: group.label, entries: [] };
      onGroupsChange?.([...groups, newGroup]);
      setAddingGroupOpen(false);
      setNewGroupLabel("");
    } finally {
      setIsAddingGroup(false);
    }
  };
  ```

- [ ] **Step 3: Update card total to include grouped entries**

  Replace the existing `entriesTotal` line:

  ```tsx
  const ungroupedTotal = sumAdditionalEntries(entries);
  const groupedTotal = groups.reduce((sum, g) => sum + sumAdditionalEntries(g.entries), 0);
  const entriesTotal = ungroupedTotal + groupedTotal;
  ```

- [ ] **Step 4: Add the group dropdown to the ungrouped entry edit form**

  In the ungrouped entry edit form (the `editingId === entry.id` branch), add a `<select>` for group assignment. Find the grid that contains the two `Input` fields and the Save/Cancel buttons, and insert a `<select>` between the amount input and the Save button. Only render it when `type === "expense"` and `groups.length > 0`.

  Add a state variable for the edit form's selected group:

  ```tsx
  const [editGroupId, setEditGroupId] = useState<number | null>("none" as unknown as null);
  ```

  Actually use a discriminated value — add this alongside other state:

  ```tsx
  const [editEntryGroupId, setEditEntryGroupId] = useState<number | "none">("none");
  ```

  Update `openEditForm`:

  ```tsx
  const openEditForm = (entry: AdditionalEntry) => {
    setEditingId(entry.id);
    setEditLabel(entry.label);
    setEditAmount(String(entry.amount));
    setEditEntryGroupId("none"); // ungrouped entries have no group
  };
  ```

  Update `handleEdit` to include `groupId` when it changed:

  ```tsx
  const handleEdit = async (id: number) => {
    if (savingId === id) return;
    const amount = parseAmountInput(editAmount);
    if (!editLabel.trim() || isNaN(amount)) return;

    const toGroupId = editEntryGroupId === "none" ? null : editEntryGroupId;

    setSavingId(id);
    try {
      const body: Record<string, unknown> = { label: editLabel.trim(), amount };
      if (type === "expense" && toGroupId !== null) body.groupId = toGroupId;

      const res = await fetch(`/api/months/${monthId}/entries/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) return;
      const updated = await res.json();
      const updatedEntry: AdditionalEntry = { ...updated, amount: parseFloat(updated.amount) };

      if (type === "expense" && toGroupId !== null) {
        // Entry is being moved into a group — remove from ungrouped, notify parent
        onEntriesChange(sortAdditionalEntriesDesc(entries.filter((e) => e.id !== id)));
        onEntryGroupChanged?.(updatedEntry, toGroupId);
      } else {
        onEntriesChange(
          sortAdditionalEntriesDesc(
            entries.map((e) => (e.id === id ? updatedEntry : e))
          )
        );
      }
      setEditingId(null);
    } finally {
      setSavingId(null);
    }
  };
  ```

  In the JSX for the edit form (inside `sortedEntries.map`), add the group select after `renderAmountInput` (only when expense + groups exist):

  ```tsx
  {type === "expense" && groups.length > 0 && (
    <select
      className="h-9 rounded-md border border-input bg-background px-3 text-sm"
      value={editEntryGroupId === "none" ? "none" : String(editEntryGroupId)}
      onChange={(e) =>
        setEditEntryGroupId(e.target.value === "none" ? "none" : parseInt(e.target.value, 10))
      }
      disabled={savingId === entry.id}
    >
      <option value="none">{t("noGroup")}</option>
      {groups.map((g) => (
        <option key={g.id} value={String(g.id)}>
          {g.label}
        </option>
      ))}
    </select>
  )}
  ```

- [ ] **Step 5: Render groups and the "Añadir grupo" button in JSX**

  In the `CardContent`, replace the existing button/form section at the top with:

  ```tsx
  <div>
    {!readOnly ? (
      <div className="flex items-center gap-3 pb-1">
        {addingFormOpen ? null : (
          <button
            className="inline-flex items-center gap-2 rounded-md text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            onClick={() => setAddingFormOpen(true)}
            type="button"
          >
            <Plus className="h-3.5 w-3.5" /> {t("addEntry")}
          </button>
        )}
        {!addingFormOpen && type === "expense" && (
          <>
            <div className="h-3.5 w-px bg-border" />
            {addingGroupOpen ? null : (
              <button
                className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground/70 transition-colors hover:text-muted-foreground"
                onClick={() => setAddingGroupOpen(true)}
                type="button"
              >
                <FolderPlus className="h-3 w-3" /> {t("addGroup")}
              </button>
            )}
          </>
        )}
      </div>
    ) : null}

    {/* Add entry form */}
    {!readOnly && addingFormOpen ? (
      <div className="rounded-xl border border-border/70 bg-muted/20 p-1.5" aria-busy={isAdding}>
        <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_7rem_auto_auto] sm:items-center">
          {/* ... existing add form inputs unchanged ... */}
        </div>
      </div>
    ) : null}

    {/* Add group inline form */}
    {!readOnly && type === "expense" && addingGroupOpen ? (
      <div className="rounded-xl border border-border/70 bg-muted/20 p-1.5" aria-busy={isAddingGroup}>
        <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center">
          <Input
            className="h-9 min-w-0 text-sm"
            placeholder={t("groupNamePlaceholder")}
            value={newGroupLabel}
            onChange={(e) => setNewGroupLabel(e.target.value)}
            disabled={isAddingGroup}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAddGroup();
              if (e.key === "Escape" && !isAddingGroup) {
                setAddingGroupOpen(false);
                setNewGroupLabel("");
              }
            }}
            autoFocus
          />
          <Button size="sm" className="h-9 w-full px-3 sm:w-auto" onClick={handleAddGroup} disabled={isAddingGroup}>
            {isAddingGroup ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            {isAddingGroup ? t("addingGroup") : t("add")}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-9 w-full px-3 sm:w-auto"
            onClick={() => { setAddingGroupOpen(false); setNewGroupLabel(""); }}
            disabled={isAddingGroup}
          >
            {t("cancel")}
          </Button>
        </div>
      </div>
    ) : null}
  </div>
  ```

  Then, before the ungrouped entries list, render group rows:

  ```tsx
  {/* Groups (expense card only) */}
  {type === "expense" && groups.length > 0 && (
    <div className="flex flex-col gap-2">
      {groups.map((group) => (
        <AdditionalEntryGroupRow
          key={group.id}
          monthId={monthId}
          group={group}
          allGroups={groups}
          onGroupUpdate={(updated) =>
            onGroupsChange?.(groups.map((g) => (g.id === updated.id ? updated : g)))
          }
          onGroupDelete={(groupId) =>
            onGroupsChange?.(groups.filter((g) => g.id !== groupId))
          }
          onEntryGroupChanged={onEntryGroupChanged ?? (() => {})}
          readOnly={readOnly}
        />
      ))}
    </div>
  )}
  ```

- [ ] **Step 6: Verify build**

  ```bash
  npm run build
  ```

  Expected: Errors only in `month-overview.tsx` (not yet passing groups props).

- [ ] **Step 7: Commit**

  ```bash
  git add src/components/monthly/additional-entries-card.tsx
  git commit -m "feat(ui): update AdditionalEntriesCard with group support"
  ```

---

## Task 10: Wire Groups in `MonthOverview`

**Files:**
- Modify: `src/components/monthly/month-overview.tsx`

- [ ] **Step 1: Add `handleGroupsChange` callback**

  After the existing `handleEntriesChange` callback, add:

  ```tsx
  const handleGroupsChange = useCallback((groups: AdditionalEntryGroup[], monthNum: number) => {
    setMonths((prev) => {
      const updated = prev.map((m) => {
        if (m.month !== monthNum) return m;
        return { ...m, additionalExpenseGroups: groups };
      });
      const recomputedMonths = recompute(updated);
      if (onYearDataChange) {
        onYearDataChange({ config, recurringExpenses: yearRecurringExpenses, months: recomputedMonths });
      }
      return recomputedMonths;
    });
  }, [config, onYearDataChange, recompute, yearRecurringExpenses]);
  ```

  Add `AdditionalEntryGroup` to the existing types import at the top of the file:

  ```tsx
  import type { MonthData, YearData, AdditionalEntry, AdditionalEntryGroup, RecurringExpense } from "@/lib/types";
  ```

- [ ] **Step 2: Add `handleEntryGroupChanged` callback**

  This handles moving an entry between groups (or to/from ungrouped) at the month level:

  ```tsx
  const handleEntryGroupChanged = useCallback((
    entry: AdditionalEntry,
    toGroupId: number | null,
    monthNum: number
  ) => {
    setMonths((prev) => {
      const updated = prev.map((m) => {
        if (m.month !== monthNum) return m;

        // Remove entry from ungrouped and all groups
        const newUngrouped = m.additionalExpenses.filter((e) => e.id !== entry.id);
        const newGroups = m.additionalExpenseGroups.map((g) => ({
          ...g,
          entries: g.entries.filter((e) => e.id !== entry.id),
        }));

        // Add entry to its new destination
        if (toGroupId === null) {
          return {
            ...m,
            additionalExpenses: sortAdditionalEntriesDesc([...newUngrouped, entry]),
            additionalExpenseGroups: newGroups,
          };
        }
        return {
          ...m,
          additionalExpenses: newUngrouped,
          additionalExpenseGroups: newGroups.map((g) =>
            g.id === toGroupId
              ? { ...g, entries: sortAdditionalEntriesDesc([...g.entries, entry]) }
              : g
          ),
        };
      });
      const recomputedMonths = recompute(updated);
      if (onYearDataChange) {
        onYearDataChange({ config, recurringExpenses: yearRecurringExpenses, months: recomputedMonths });
      }
      return recomputedMonths;
    });
  }, [config, onYearDataChange, recompute, yearRecurringExpenses]);
  ```

- [ ] **Step 3: Pass groups props to the expense `AdditionalEntriesCard`**

  Find the expense `AdditionalEntriesCard` usage (around line 657) and add the three new props:

  ```tsx
  <AdditionalEntriesCard
    monthId={month.id}
    type="expense"
    entries={month.additionalExpenses}
    onEntriesChange={(entries) => handleEntriesChange("expense", entries)}
    groups={month.additionalExpenseGroups}
    onGroupsChange={(groups) => handleGroupsChange(groups, month.month)}
    onEntryGroupChanged={(entry, toGroupId) => handleEntryGroupChanged(entry, toGroupId, month.month)}
    readOnly={readOnly}
    title={tOverview("additionalExpensesTitle")}
    movingEntryId={movingEntry?.entryId ?? null}
    onEntryDragStart={(entry) => setDraggedEntry({
      entry,
      type: "expense",
      sourceMonthId: month.id,
      sourceMonthNumber: month.month,
    })}
    onEntryDragEnd={() => {
      setDraggedEntry(null);
      setDragOverMonthId(null);
    }}
  />
  ```

  The income card remains unchanged (no groups).

- [ ] **Step 4: Verify build**

  ```bash
  npm run build
  ```

  Expected: Clean build with zero TypeScript errors.

- [ ] **Step 5: Lint**

  ```bash
  npm run lint
  ```

  Expected: No lint errors.

- [ ] **Step 6: Commit**

  ```bash
  git add src/components/monthly/month-overview.tsx
  git commit -m "feat(ui): wire AdditionalExpenseGroups into MonthOverview"
  ```

---

## Task 11: Smoke Test in Browser

- [ ] **Step 1: Start the dev server**

  ```bash
  npm run dev
  ```

- [ ] **Step 2: Test group creation**

  Open a month with additional expenses. Click "Añadir grupo", type a group name, press Enter. Verify a collapsed group row appears at the top of the expense card.

- [ ] **Step 3: Test expand/collapse**

  Click the group row to expand it. Verify the chevron rotates and the group body appears. Click again to collapse.

- [ ] **Step 4: Test adding an entry to the group**

  Expand the group, click "Añadir al grupo", fill in label and amount, save. Verify the entry appears inside the group and the group's total updates. Verify the card's grand total also increases.

- [ ] **Step 5: Test rename**

  Expand the group, click the group name text, type a new name, press Enter. Verify the header updates.

- [ ] **Step 6: Test move entry to a group**

  Add an ungrouped expense. Open its edit form. Verify a "Grupo" dropdown appears. Select the group, save. Verify the entry disappears from the ungrouped list and appears inside the group.

- [ ] **Step 7: Test move entry between groups**

  Create a second group. Inside the first group, open an entry's edit form, change the group dropdown to the second group, save. Verify it moves.

- [ ] **Step 8: Test delete group**

  Click the trash icon on a group. Verify the confirmation dialog appears with the correct name and entry count. Confirm. Verify the group and all its entries are gone.

- [ ] **Step 9: Verify income card is unaffected**

  Check that the additional income card has no "Añadir grupo" button and no groups section.

- [ ] **Step 10: Verify month totals are correct**

  Add a grouped expense and verify the month's `totalExpenses` (shown in the summary) reflects it.

---

## Task 12: Update Feature Documentation

**Files:**
- Modify: `docs/features/additional-entries.md`

- [ ] **Step 1: Add groups section**

  Append the following section to `docs/features/additional-entries.md`:

  ```markdown
  ## Expense Groups

  Users can group related additional expenses within a month (e.g. "Viaje a Roma"). Groups are expenses-only and per-month.

  ### Data
  - `additionalEntryGroups` table: `id`, `monthId`, `label`, `createdAt`. Cascade-deleted with their month.
  - `additionalEntries.groupId` (nullable FK → `additionalEntryGroups`): `null` = ungrouped.
  - `MonthData.additionalExpenses` contains only **ungrouped** expenses. `MonthData.additionalExpenseGroups` contains grouped expenses.
  - Both sets are summed into `totalExpenses` (see `calculations.ts`).

  ### API
  - `POST /api/months/[monthId]/entry-groups` — create a group `{ label }`.
  - `PATCH /api/months/[monthId]/entry-groups/[groupId]` — rename `{ label }`.
  - `DELETE /api/months/[monthId]/entry-groups/[groupId]` — delete group and all its entries (DB cascade).
  - `PATCH /api/months/[monthId]/entries/[entryId]` — accepts `groupId: number | null` to move an entry.

  ### UI
  - **`AdditionalEntryGroupRow`** (`src/components/monthly/additional-entry-group-row.tsx`): self-contained collapsed/expanded group row. Manages its own UI state.
  - Groups render above ungrouped entries in `AdditionalEntriesCard`.
  - Collapsed state resets on reload (UI-only state, not persisted).
  - Group name is editable inline (click to rename).
  - Deleting a group shows a confirmation dialog listing entry count.
  - Entries can be moved to/from groups via the group dropdown in the entry edit form.
  ```

- [ ] **Step 2: Commit**

  ```bash
  git add docs/features/additional-entries.md docs/plans/2026-05-17-additional-expense-groups.md
  git commit -m "docs: document additional expense groups feature"
  ```

---

## Self-Review Checklist

- [x] **Spec coverage:** DB model ✓, API routes ✓, Types ✓, Calculations (grouped + ungrouped) ✓, Data loading ✓, Component architecture ✓, All UX flows (create, add, move, rename, delete, read-only) ✓, i18n ✓, Docs ✓
- [x] **No placeholders:** All steps contain complete code
- [x] **Type consistency:** `AdditionalEntryGroup` used consistently across all tasks; `onEntryGroupChanged(entry, toGroupId)` signature matches between Task 8 (component), Task 9 (card), and Task 10 (overview)
- [x] **`additionalEntryGroups` defined before `additionalEntries` in schema** — avoids circular FK reference
- [x] **`db.query.additionalEntryGroups`** — requires Drizzle relational queries config. If the project doesn't configure Drizzle relations, replace with `db.select().from(additionalEntryGroups).where(...)` pattern (same as used elsewhere in the codebase)
