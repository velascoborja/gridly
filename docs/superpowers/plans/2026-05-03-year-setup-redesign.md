# Year Setup Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild `/setup/[year]` as a single-page guided financial setup workspace with a responsive stepper, grouped form sections, and a live summary while preserving existing year creation behavior.

**Architecture:** Keep `SetupPageClient` as the only state and submission owner. Replace the old blue promotional panel and long flat form with presentational constants for sections, a grouped form layout, and derived summary values computed from the existing local string state. Keep `createAndPrefillYear(payload)` and redirect behavior unchanged.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, next-intl, Tailwind CSS v4, shadcn/ui primitives, node:test source tests.

---

## File Structure

- Modify: `src/components/setup/setup-page-client.test.ts`
  - Owns source-level expectations for setup UI structure and behavior preservation.
- Modify: `src/components/setup/setup-page-client.tsx`
  - Owns local form state, derived summary values, responsive setup layout, submit behavior, and recurring expense editor placement.
- Modify: `messages/es.json`
  - Spanish setup copy for new header, stepper, grouped sections, and summary panel.
- Modify: `messages/en.json`
  - English setup copy mirroring the Spanish keys.
- Modify: `docs/features/year-settings.md`
  - Documents the redesigned creation screen and confirms unchanged behavior.

No API routes, database schema files, server actions, or calculation helpers should change.

---

### Task 1: Lock Redesign Expectations In Tests

**Files:**
- Modify: `src/components/setup/setup-page-client.test.ts`

- [ ] **Step 1: Add failing tests for grouped setup, removed blue-card copy, and summary derivation**

Append these tests to `src/components/setup/setup-page-client.test.ts`:

```ts
test("setup screen uses guided section translation keys", () => {
  const source = readFileSync(new URL("./setup-page-client.tsx", import.meta.url), "utf8");

  assert.match(source, /SETUP_STEPS/);
  assert.match(source, /id: "starting-point"/);
  assert.match(source, /id: "income"/);
  assert.match(source, /id: "monthly-plan"/);
  assert.match(source, /id: "recurring-expenses"/);
  assert.match(source, /id: "review-create"/);
  assert.match(source, /t\("sections\.startingPoint\.title"\)/);
  assert.match(source, /t\("sections\.income\.title"\)/);
  assert.match(source, /t\("sections\.monthlyPlan\.title"\)/);
  assert.match(source, /t\("sections\.growth\.title"\)/);
  assert.match(source, /t\("sections\.recurringExpenses\.title"\)/);
});

test("setup screen removes the decorative blue-card status copy", () => {
  const source = readFileSync(new URL("./setup-page-client.tsx", import.meta.url), "utf8");

  assert.doesNotMatch(source, /guidedConfig/);
  assert.doesNotMatch(source, /startingBalanceReal/);
  assert.doesNotMatch(source, /extraPaysLabel/);
  assert.doesNotMatch(source, /redirectionLabel/);
  assert.doesNotMatch(source, /redirectionNote/);
  assert.doesNotMatch(source, /rounded-\[2rem\]/);
  assert.doesNotMatch(source, /rgba\(37,99,235/);
});

test("setup summary derives values from local state without adding payload fields", () => {
  const source = readFileSync(new URL("./setup-page-client.tsx", import.meta.url), "utf8");

  assert.match(source, /const summary = /);
  assert.match(source, /parseNumber\(values\.estimatedSalary\)/);
  assert.match(source, /parseNumber\(values\.monthlyHomeExpense\)/);
  assert.match(source, /parseNumber\(values\.monthlyPersonalBudget\)/);
  assert.match(source, /parseNumber\(values\.monthlyInvestment\)/);
  assert.match(source, /summary\.estimatedMonthlySavings/);
  assert.match(source, /t\("summary\.title"\)/);
  assert.match(source, /t\("summary\.monthlySavings"\)/);
  assert.doesNotMatch(source, /estimatedMonthlySavings,/);
});
```

- [ ] **Step 2: Run the setup source tests and verify they fail**

Run:

```bash
npm test -- src/components/setup/setup-page-client.test.ts
```

Expected: the new tests fail because `SETUP_STEPS`, grouped section keys, summary derivation, and removed decorative-card assertions are not true yet.

- [ ] **Step 3: Commit the failing tests**

Run:

```bash
git add src/components/setup/setup-page-client.test.ts
git commit -m "test: lock year setup redesign expectations"
```

---

### Task 2: Add Setup Translation Keys

**Files:**
- Modify: `messages/es.json`
- Modify: `messages/en.json`

- [ ] **Step 1: Add Spanish setup keys**

In `messages/es.json`, update the `Setup` object. Keep existing field labels, placeholders, errors, submit strings, and recurring expense strings. Replace old blue-card-only copy with these keys:

```json
"headerEyebrow": "Nuevo ejercicio",
"mainHeading": "Configura {year}",
"descriptionEditable": "Estos valores crearán los 12 meses del año. Podrás ajustar cualquier mes después.",
"descriptionFixed": "Gridly usará el cierre previsto de {previousYear} como saldo inicial de {year}.",
"formDescriptionEditable": "Introduce la base financiera del año antes de generar los meses.",
"formDescriptionFixed": "Saldo inicial enlazado a {previousYear}: {balance}.",
"stepperLabel": "Secciones de configuración",
"steps": {
  "startingPoint": "Inicio",
  "income": "Ingresos",
  "monthlyPlan": "Plan mensual",
  "recurringExpenses": "Recurrentes",
  "reviewCreate": "Revisar"
},
"sections": {
  "startingPoint": {
    "title": "Punto de partida",
    "description": "Define el saldo con el que empieza el año."
  },
  "income": {
    "title": "Ingresos",
    "description": "Configura el salario mensual y las pagas extra de junio y diciembre."
  },
  "monthlyPlan": {
    "title": "Plan mensual",
    "description": "Reparte los gastos fijos y la inversión que se copiarán a cada mes."
  },
  "growth": {
    "title": "Crecimiento",
    "description": "Añade el tipo anual que Gridly usará para estimar intereses."
  },
  "recurringExpenses": {
    "title": "Gastos recurrentes",
    "description": "Añade gastos con nombre que se copiarán automáticamente en cada mes."
  },
  "reviewCreate": {
    "title": "Revisar y crear",
    "description": "Comprueba el resumen antes de generar el año completo."
  }
},
"summary": {
  "title": "Vista previa del año",
  "description": "Resumen calculado con los valores actuales.",
  "startingBalance": "Saldo inicial",
  "startingBalanceLinked": "Enlazado desde {previousYear}",
  "monthlyIncome": "Ingreso mensual",
  "plannedExpenses": "Gastos planificados",
  "monthlyInvestment": "Inversión mensual",
  "monthlySavings": "Ahorro mensual estimado",
  "extraPays": "Pagas extra",
  "extraPaysEnabled": "{amount} en junio y diciembre",
  "extraPaysDisabled": "No se crearán pagas extra",
  "recurringNote": "Los gastos recurrentes se copiarán en los 12 meses.",
  "emptyValue": "Sin definir"
}
```

- [ ] **Step 2: Add English setup keys**

In `messages/en.json`, update the `Setup` object with the same key structure:

```json
"headerEyebrow": "New financial year",
"mainHeading": "Configure {year}",
"descriptionEditable": "These values will create the 12 months of the year. You can adjust any month later.",
"descriptionFixed": "Gridly will use the projected close of {previousYear} as the starting balance for {year}.",
"formDescriptionEditable": "Enter the financial baseline before generating the months.",
"formDescriptionFixed": "Starting balance linked to {previousYear}: {balance}.",
"stepperLabel": "Setup sections",
"steps": {
  "startingPoint": "Start",
  "income": "Income",
  "monthlyPlan": "Monthly plan",
  "recurringExpenses": "Recurring",
  "reviewCreate": "Review"
},
"sections": {
  "startingPoint": {
    "title": "Starting point",
    "description": "Define the balance the year starts with."
  },
  "income": {
    "title": "Income",
    "description": "Configure monthly salary and the extra payments for June and December."
  },
  "monthlyPlan": {
    "title": "Monthly plan",
    "description": "Set the fixed expenses and investment copied into each month."
  },
  "growth": {
    "title": "Growth",
    "description": "Add the annual rate Gridly will use to estimate interest."
  },
  "recurringExpenses": {
    "title": "Recurring expenses",
    "description": "Add named expenses that are copied automatically into every month."
  },
  "reviewCreate": {
    "title": "Review and create",
    "description": "Check the summary before generating the full year."
  }
},
"summary": {
  "title": "Year preview",
  "description": "Summary calculated from the current values.",
  "startingBalance": "Starting balance",
  "startingBalanceLinked": "Linked from {previousYear}",
  "monthlyIncome": "Monthly income",
  "plannedExpenses": "Planned expenses",
  "monthlyInvestment": "Monthly investment",
  "monthlySavings": "Estimated monthly savings",
  "extraPays": "Extra pays",
  "extraPaysEnabled": "{amount} in June and December",
  "extraPaysDisabled": "No extra pays will be created",
  "recurringNote": "Recurring expenses will be copied into all 12 months.",
  "emptyValue": "Not set"
}
```

- [ ] **Step 3: Run tests and verify translations do not break JSON parsing**

Run:

```bash
npm test -- src/components/setup/setup-page-client.test.ts
```

Expected: tests still fail on component structure, not JSON syntax.

- [ ] **Step 4: Commit translation keys**

Run:

```bash
git add messages/es.json messages/en.json
git commit -m "feat: add year setup redesign copy"
```

---

### Task 3: Refactor SetupPageClient Into Guided Workspace

**Files:**
- Modify: `src/components/setup/setup-page-client.tsx`

- [ ] **Step 1: Add setup section metadata and numeric parser**

In `src/components/setup/setup-page-client.tsx`, replace the current `interface Field` and `FIELDS` approach with top-level metadata below the props interface:

```ts
const SETUP_STEPS = [
  { id: "starting-point", labelKey: "steps.startingPoint" },
  { id: "income", labelKey: "steps.income" },
  { id: "monthly-plan", labelKey: "steps.monthlyPlan" },
  { id: "recurring-expenses", labelKey: "steps.recurringExpenses" },
  { id: "review-create", labelKey: "steps.reviewCreate" },
] as const;

const NUMERIC_FIELDS = [
  "estimatedSalary",
  "monthlyHomeExpense",
  "monthlyPersonalBudget",
  "monthlyInvestment",
  "interestRate",
] as const;

type NumericField = (typeof NUMERIC_FIELDS)[number];

const parseNumber = (value: string) => {
  const parsed = parseFloat(value.replace(",", "."));
  return Number.isNaN(parsed) ? 0 : parsed;
};
```

Inside `SetupPageClient`, replace `FIELDS` with:

```ts
const numericFields: Array<{ key: NumericField; label: string; placeholder: string }> = [
  { key: "estimatedSalary", label: t("estimatedSalary"), placeholder: t("estimatedSalaryPlaceholder") },
  { key: "monthlyHomeExpense", label: t("monthlyHomeExpense"), placeholder: t("monthlyHomeExpensePlaceholder") },
  { key: "monthlyPersonalBudget", label: t("monthlyPersonalBudget"), placeholder: t("monthlyPersonalBudgetPlaceholder") },
  { key: "monthlyInvestment", label: t("monthlyInvestment"), placeholder: t("monthlyInvestmentPlaceholder") },
  { key: "interestRate", label: t("interestRate"), placeholder: t("interestRatePlaceholder") },
];
```

Keep the initial `values` state equivalent:

```ts
const [values, setValues] = useState<Record<string, string>>(
  Object.fromEntries([
    ["startingBalance", startingBalanceEditable ? "" : String(derivedStartingBalance)],
    ["estimatedExtraPayment", ""],
    ...numericFields.map((field) => [field.key, ""]),
  ])
);
```

- [ ] **Step 2: Use `parseNumber` in submit payload without changing payload fields**

Replace the current payload parsing in `handleSubmit` with:

```ts
const payload = {
  year,
  startingBalance: parseNumber(values.startingBalance),
  estimatedSalary: parseNumber(values.estimatedSalary),
  hasExtraPayments,
  estimatedExtraPayment: hasExtraPayments ? parseNumber(values.estimatedExtraPayment) : 0,
  monthlyInvestment: parseNumber(values.monthlyInvestment),
  monthlyHomeExpense: parseNumber(values.monthlyHomeExpense),
  monthlyPersonalBudget: parseNumber(values.monthlyPersonalBudget),
  interestRate: parseNumber(values.interestRate) / 100,
  recurringExpenses,
};
```

- [ ] **Step 3: Add summary derivation below state declarations**

Add:

```ts
const summary = {
  startingBalance: parseNumber(values.startingBalance),
  monthlyIncome: parseNumber(values.estimatedSalary),
  plannedExpenses:
    parseNumber(values.monthlyHomeExpense) + parseNumber(values.monthlyPersonalBudget),
  monthlyInvestment: parseNumber(values.monthlyInvestment),
  estimatedMonthlySavings:
    parseNumber(values.estimatedSalary) -
    parseNumber(values.monthlyHomeExpense) -
    parseNumber(values.monthlyPersonalBudget) -
    parseNumber(values.monthlyInvestment),
  estimatedExtraPayment: parseNumber(values.estimatedExtraPayment),
};

const displayCurrency = (amount: number) =>
  amount === 0 ? t("summary.emptyValue") : formatCurrency(amount, locale);
```

- [ ] **Step 4: Replace the current returned JSX with the guided shell**

Replace the current `return (...)` content with a layout that keeps the existing form controls and submit handler. Use this structure:

```tsx
return (
  <div className="min-h-screen bg-[linear-gradient(180deg,rgba(248,250,252,0.98),rgba(255,255,255,1))] px-4 py-6 text-foreground sm:px-6 lg:px-8">
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">
      <header className="rounded-lg border border-border/70 bg-card/95 px-4 py-4 shadow-[0_18px_42px_-32px_rgba(50,50,93,0.32)] sm:px-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="rounded-md border border-border/70 bg-white px-3 py-2 shadow-sm">
              <Image
                src="/gridly-wordmark.svg"
                alt="Gridly"
                width={216}
                height={64}
                className="h-9 w-[122px]"
                priority
              />
            </div>
            {process.env.NODE_ENV === "development" ? (
              <Badge variant="default" className="w-fit uppercase">
                DEV
              </Badge>
            ) : null}
          </div>
          <div className="min-w-0 sm:max-w-2xl sm:text-right">
            <p className="text-xs font-medium uppercase text-muted-foreground">{t("headerEyebrow")}</p>
            <h1 className="mt-1 text-2xl font-medium tracking-tight text-foreground sm:text-3xl">
              {t("mainHeading", { year })}
            </h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {startingBalanceEditable
                ? t("descriptionEditable")
                : t("descriptionFixed", { year, previousYear: previousYear ?? "" })}
            </p>
          </div>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="grid gap-4 lg:grid-cols-[176px_minmax(0,1fr)_320px] lg:items-start">
        <nav
          aria-label={t("stepperLabel")}
          className="lg:sticky lg:top-5"
        >
          <ol className="flex gap-2 overflow-x-auto rounded-lg border border-border/70 bg-card/95 p-2 shadow-sm lg:flex-col lg:overflow-visible">
            {SETUP_STEPS.map((step, index) => (
              <li key={step.id} className="shrink-0 lg:shrink">
                <a
                  href={`#${step.id}`}
                  className="flex min-w-32 items-center gap-2 rounded-md border border-transparent px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/20 hover:bg-primary/[0.04] hover:text-primary lg:min-w-0"
                >
                  <span className="flex size-6 items-center justify-center rounded-md border border-border/70 bg-background text-xs tabular-nums">
                    {index + 1}
                  </span>
                  <span>{t(step.labelKey)}</span>
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="space-y-4">
          <Card id="starting-point" className="scroll-mt-5 border-border/70 bg-card/95 shadow-sm">
            <CardHeader>
              <CardTitle>{t("sections.startingPoint.title")}</CardTitle>
              <CardDescription>{t("sections.startingPoint.description")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  {startingBalanceEditable ? t("startingBalanceLabel") : t("startingBalanceDerived")}
                </label>
                <Input
                  type="text"
                  inputMode="decimal"
                  value={values.startingBalance}
                  onChange={(event) => setValues((prev) => ({ ...prev, startingBalance: event.target.value }))}
                  placeholder={t("startingBalancePlaceholder")}
                  disabled={submitting || !startingBalanceEditable}
                  className="h-11 rounded-md px-4 text-sm"
                />
                {!startingBalanceEditable ? (
                  <p className="text-sm leading-6 text-muted-foreground">
                    {t("startingBalanceNote", { previousYear: previousYear ?? "" })}
                  </p>
                ) : null}
              </div>
            </CardContent>
          </Card>

          <Card id="income" className="scroll-mt-5 border-border/70 bg-card/95 shadow-sm">
            <CardHeader>
              <CardTitle>{t("sections.income.title")}</CardTitle>
              <CardDescription>{t("sections.income.description")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">{t("estimatedSalary")}</label>
                <Input
                  type="text"
                  inputMode="decimal"
                  value={values.estimatedSalary}
                  onChange={(event) => setValues((prev) => ({ ...prev, estimatedSalary: event.target.value }))}
                  placeholder={t("estimatedSalaryPlaceholder")}
                  disabled={submitting}
                  className="h-11 rounded-md px-4 text-sm"
                />
              </div>
              <div className="rounded-lg border border-border/70 bg-muted/20 p-4">
                <label className="flex items-start justify-between gap-4">
                  <span className="space-y-1">
                    <span className="block text-sm font-medium text-foreground">{t("hasExtraPayments")}</span>
                    <span className="block text-sm leading-6 text-muted-foreground">
                      {t("hasExtraPaymentsDescription")}
                    </span>
                  </span>
                  <span className="relative mt-1 inline-flex shrink-0 items-center">
                    <input
                      type="checkbox"
                      role="switch"
                      checked={hasExtraPayments}
                      onChange={(event) => setHasExtraPayments(event.target.checked)}
                      disabled={submitting}
                      className="peer sr-only"
                    />
                    <span
                      aria-hidden="true"
                      className={cn(
                        "inline-flex h-6 w-11 items-center rounded-full border p-0.5 transition-[background-color,box-shadow] duration-200 ease-out peer-focus-visible:ring-4 peer-focus-visible:ring-ring/25",
                        hasExtraPayments
                          ? "border-primary/70 bg-primary shadow-[0_8px_18px_-10px_rgba(83,58,253,0.7)]"
                          : "border-border bg-background shadow-inner",
                        submitting ? "opacity-50" : "cursor-pointer"
                      )}
                    >
                      <span
                        className={cn(
                          "block size-5 rounded-full bg-white shadow-[0_2px_8px_rgba(15,23,42,0.18)] transition-transform duration-200 ease-out",
                          hasExtraPayments ? "translate-x-5" : "translate-x-0"
                        )}
                      />
                    </span>
                  </span>
                </label>
                <div
                  className={cn(
                    "grid transition-[grid-template-rows,opacity,margin-top] duration-200 ease-out",
                    hasExtraPayments ? "mt-4 grid-rows-[1fr] opacity-100" : "mt-0 grid-rows-[0fr] opacity-0"
                  )}
                  aria-hidden={!hasExtraPayments}
                >
                  <div className="overflow-hidden px-1 pb-2">
                    <div className="border-t border-border/50 pt-4">
                      <label className="block text-sm font-medium leading-5 text-foreground">
                        {t("estimatedExtraPayment")}
                      </label>
                      <Input
                        type="text"
                        inputMode="decimal"
                        value={values.estimatedExtraPayment}
                        onChange={(event) =>
                          setValues((prev) => ({ ...prev, estimatedExtraPayment: event.target.value }))
                        }
                        placeholder={t("estimatedExtraPaymentPlaceholder")}
                        disabled={submitting || !hasExtraPayments}
                        className="mt-5 h-11 rounded-md px-4 text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  </div>
);
```

Add these remaining cards directly after the `income` card in the central form column:

```tsx
<Card id="monthly-plan" className="scroll-mt-5 border-border/70 bg-card/95 shadow-sm">
  <CardHeader>
    <CardTitle>{t("sections.monthlyPlan.title")}</CardTitle>
    <CardDescription>{t("sections.monthlyPlan.description")}</CardDescription>
  </CardHeader>
  <CardContent className="grid gap-4 sm:grid-cols-3">
    {(["monthlyHomeExpense", "monthlyPersonalBudget", "monthlyInvestment"] as const).map((field) => {
      const item = numericFields.find((numericField) => numericField.key === field);
      if (!item) return null;
      return (
        <div key={field} className="space-y-2">
          <label className="text-sm font-medium text-foreground">{item.label}</label>
          <Input
            type="text"
            inputMode="decimal"
            value={values[field]}
            onChange={(event) => setValues((prev) => ({ ...prev, [field]: event.target.value }))}
            placeholder={item.placeholder}
            disabled={submitting}
            className="h-11 rounded-md px-4 text-sm"
          />
        </div>
      );
    })}
  </CardContent>
</Card>

<Card className="border-border/70 bg-card/95 shadow-sm">
  <CardHeader>
    <CardTitle>{t("sections.growth.title")}</CardTitle>
    <CardDescription>{t("sections.growth.description")}</CardDescription>
  </CardHeader>
  <CardContent>
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">{t("interestRate")}</label>
      <Input
        type="text"
        inputMode="decimal"
        value={values.interestRate}
        onChange={(event) => setValues((prev) => ({ ...prev, interestRate: event.target.value }))}
        placeholder={t("interestRatePlaceholder")}
        disabled={submitting}
        className="h-11 rounded-md px-4 text-sm"
      />
    </div>
  </CardContent>
</Card>

<div id="recurring-expenses" className="scroll-mt-5">
  <RecurringExpenseTemplateEditor
    entries={recurringExpenses}
    onChange={setRecurringExpenses}
    disabled={submitting}
    title={t("sections.recurringExpenses.title")}
    description={t("sections.recurringExpenses.description")}
  />
</div>

<Card id="review-create" className="scroll-mt-5 border-primary/15 bg-primary/[0.03] shadow-sm lg:hidden">
  <CardHeader>
    <CardTitle>{t("sections.reviewCreate.title")}</CardTitle>
    <CardDescription>{t("sections.reviewCreate.description")}</CardDescription>
  </CardHeader>
  <CardContent className="space-y-4">
    <SummaryRows />
    {error ? (
      <p role="alert" className="rounded-md border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm leading-6 text-destructive">
        {error}
      </p>
    ) : null}
    <Button type="submit" className="h-11 w-full rounded-md text-sm font-medium" disabled={submitting}>
      {submitting ? t("submitting") : t("submit")}
    </Button>
  </CardContent>
</Card>
```

Add the desktop summary after the central form column and before the closing `</form>`:

```tsx
<aside className="hidden lg:sticky lg:top-5 lg:block">
  <Card className="border-primary/15 bg-card/95 shadow-[0_24px_54px_-38px_rgba(50,50,93,0.45)]">
    <CardHeader>
      <CardTitle>{t("summary.title")}</CardTitle>
      <CardDescription>{t("summary.description")}</CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      <SummaryRows />
      {error ? (
        <p role="alert" className="rounded-md border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm leading-6 text-destructive">
          {error}
        </p>
      ) : null}
      <Button type="submit" className="h-11 w-full rounded-md text-sm font-medium" disabled={submitting}>
        {submitting ? t("submitting") : t("submit")}
      </Button>
    </CardContent>
  </Card>
</aside>
```

Define `SummaryRows` inside `SetupPageClient` before the `return`:

```tsx
const SummaryRows = () => (
  <div className="space-y-3">
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm text-muted-foreground">{t("summary.startingBalance")}</span>
      <span className="font-mono text-sm tabular-nums text-foreground">
        {startingBalanceEditable
          ? displayCurrency(summary.startingBalance)
          : t("summary.startingBalanceLinked", { previousYear: previousYear ?? "" })}
      </span>
    </div>
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm text-muted-foreground">{t("summary.monthlyIncome")}</span>
      <span className="font-mono text-sm tabular-nums text-foreground">{displayCurrency(summary.monthlyIncome)}</span>
    </div>
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm text-muted-foreground">{t("summary.plannedExpenses")}</span>
      <span className="font-mono text-sm tabular-nums text-foreground">{displayCurrency(summary.plannedExpenses)}</span>
    </div>
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm text-muted-foreground">{t("summary.monthlyInvestment")}</span>
      <span className="font-mono text-sm tabular-nums text-foreground">{displayCurrency(summary.monthlyInvestment)}</span>
    </div>
    <div className="rounded-md border border-primary/15 bg-primary/[0.04] p-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-foreground">{t("summary.monthlySavings")}</span>
        <span className="font-mono text-sm font-medium tabular-nums text-foreground">
          {displayCurrency(summary.estimatedMonthlySavings)}
        </span>
      </div>
    </div>
    <div className="space-y-1 border-t border-border/60 pt-3">
      <p className="text-sm font-medium text-foreground">{t("summary.extraPays")}</p>
      <p className="text-sm leading-6 text-muted-foreground">
        {hasExtraPayments
          ? t("summary.extraPaysEnabled", { amount: displayCurrency(summary.estimatedExtraPayment) })
          : t("summary.extraPaysDisabled")}
      </p>
    </div>
    <p className="border-t border-border/60 pt-3 text-sm leading-6 text-muted-foreground">
      {t("summary.recurringNote")}
    </p>
  </div>
);
```

- [ ] **Step 5: Run setup tests and fix component issues until they pass**

Run:

```bash
npm test -- src/components/setup/setup-page-client.test.ts
```

Expected: all tests in `setup-page-client.test.ts` pass.

- [ ] **Step 6: Commit the setup client redesign**

Run:

```bash
git add src/components/setup/setup-page-client.tsx src/components/setup/setup-page-client.test.ts
git commit -m "feat: redesign year setup workspace"
```

---

### Task 4: Update Feature Documentation

**Files:**
- Modify: `docs/features/year-settings.md`

- [ ] **Step 1: Update the year creation flow documentation**

In `docs/features/year-settings.md`, under `## Year Creation Flow`, add this paragraph after the numbered list:

```md
The setup screen is a single-page guided workspace. Desktop layouts use a left section stepper, central grouped setup form, and sticky year preview panel. Mobile layouts collapse the stepper into a horizontal section row and render the preview as a normal review block near submission.
```

- [ ] **Step 2: Add a setup layout subsection**

Add this subsection before `## Navigation & Workspace Model`:

```md
## Setup Layout

The creation screen groups setup fields by financial purpose:

- **Starting point:** `startingBalance`, including a locked derived state when the balance comes from the previous year.
- **Income:** `estimatedSalary`, `hasExtraPayments`, and `estimatedExtraPayment`.
- **Monthly plan:** `monthlyHomeExpense`, `monthlyPersonalBudget`, and `monthlyInvestment`.
- **Growth:** `interestRate`.
- **Recurring expenses:** the year recurring expense template editor.
- **Review and create:** final error handling, live preview, and submit action.

The live preview is derived only from local form state. It shows the starting balance, monthly income, planned expenses, monthly investment, estimated monthly savings before interest, extra-pay status, and a reminder that recurring templates are copied into all 12 months. It does not add fields to the creation payload.
```

- [ ] **Step 3: Run the documentation sync check manually**

Read the changed documentation and confirm it does not describe any behavior change beyond layout and preview. No command is required for this step.

- [ ] **Step 4: Commit the documentation update**

Run:

```bash
git add docs/features/year-settings.md
git commit -m "docs: update year setup layout notes"
```

---

### Task 5: Full Verification And Polish

**Files:**
- Verify: `src/components/setup/setup-page-client.tsx`
- Verify: `messages/es.json`
- Verify: `messages/en.json`
- Verify: `docs/features/year-settings.md`

- [ ] **Step 1: Run all tests**

Run:

```bash
npm test
```

Expected: all node:test suites pass.

- [ ] **Step 2: Run lint**

Run:

```bash
npm run lint
```

Expected: ESLint exits with code `0`.

- [ ] **Step 3: Start the local dev server**

Run:

```bash
npm run dev
```

Expected: Next.js starts successfully. Use the printed localhost URL.

- [ ] **Step 4: Inspect the setup screen manually**

Open a setup route such as:

```text
http://localhost:3000/es/setup/2026
```

Expected desktop checks:

- No large blue promotional card is visible.
- The page has a compact header, left stepper, grouped form, and sticky summary panel.
- Section links jump to their matching form groups.
- The summary updates when editing salary, expenses, investment, starting balance, and extra-pay amount.
- Enabling extra pays reveals the extra-pay amount field.

Expected mobile checks:

- The stepper becomes a horizontal row.
- The form is single-column.
- The summary appears as part of the review/create area, not as a cramped side panel.
- Button text and section labels do not overflow.

- [ ] **Step 5: Commit final polish if needed**

If verification required fixes, commit them:

```bash
git add src/components/setup/setup-page-client.tsx messages/es.json messages/en.json docs/features/year-settings.md
git commit -m "fix: polish year setup redesign"
```

If no fixes were needed, do not create an empty commit.
