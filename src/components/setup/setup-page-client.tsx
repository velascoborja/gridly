"use client";

import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { RecurringExpenseTemplateEditor } from "@/components/recurring-expenses/recurring-expense-template-editor";
import { createAndPrefillYear } from "@/lib/server/actions/years";
import type { RecurringExpenseInput } from "@/lib/recurring-expenses";
import { parseLocalizedNumber } from "@/lib/currency-input";
import { hasSetupFieldValue } from "@/lib/setup-readiness";
import { cn, formatCurrency } from "@/lib/utils";

interface Props {
  year: number;
  derivedStartingBalance: number;
  previousYear: number | null;
  startingBalanceEditable: boolean;
}

type SetupStep = {
  id: "starting-point" | "income" | "monthly-plan" | "recurring-expenses";
  labelKey: string;
  optional?: boolean;
};

const SETUP_STEPS: readonly SetupStep[] = [
  { id: "starting-point", labelKey: "steps.startingPoint" },
  { id: "income", labelKey: "steps.income" },
  { id: "monthly-plan", labelKey: "steps.monthlyPlan" },
  { id: "recurring-expenses", labelKey: "steps.recurringExpenses", optional: true },
] as const;

const NUMERIC_FIELDS = [
  "estimatedSalary",
  "monthlyHomeExpense",
  "monthlyPersonalBudget",
  "monthlyInvestment",
  "interestRate",
] as const;

type NumericField = (typeof NUMERIC_FIELDS)[number];
type SetupStepId = SetupStep["id"];

const parseNumber = parseLocalizedNumber;

export function SetupPageClient({ year, derivedStartingBalance, previousYear, startingBalanceEditable }: Props) {
  const t = useTranslations("Setup");
  const locale = useLocale();
  const searchParams = useSearchParams();
  const redirectTo =
    searchParams.get("redirect") ?? `/${year}/${new Date().getMonth() + 1}`;

  const numericFields: Array<{ key: NumericField; label: string; placeholder: string }> = [
    { key: "estimatedSalary", label: t("estimatedSalary"), placeholder: t("estimatedSalaryPlaceholder") },
    { key: "monthlyHomeExpense", label: t("monthlyHomeExpense"), placeholder: t("monthlyHomeExpensePlaceholder") },
    { key: "monthlyPersonalBudget", label: t("monthlyPersonalBudget"), placeholder: t("monthlyPersonalBudgetPlaceholder") },
    { key: "monthlyInvestment", label: t("monthlyInvestment"), placeholder: t("monthlyInvestmentPlaceholder") },
    { key: "interestRate", label: t("interestRate"), placeholder: t("interestRatePlaceholder") },
  ];

  const numericFieldByKey = Object.fromEntries(
    NUMERIC_FIELDS.map((key) => {
      const field = numericFields.find((candidate) => candidate.key === key);
      return [key, field];
    })
  ) as Record<NumericField, { key: NumericField; label: string; placeholder: string }>;

  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries([
      ["startingBalance", startingBalanceEditable ? "" : String(derivedStartingBalance)],
      ["estimatedExtraPayment", ""],
      ...numericFields.map((field) => [field.key, ""]),
    ])
  );
  const [hasExtraPayments, setHasExtraPayments] = useState(false);
  const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpenseInput[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const completedSteps = {
    "starting-point": startingBalanceEditable ? hasSetupFieldValue(values.startingBalance) : true,
    income:
      hasSetupFieldValue(values.estimatedSalary) &&
      (!hasExtraPayments || hasSetupFieldValue(values.estimatedExtraPayment)),
    "monthly-plan":
      hasSetupFieldValue(values.monthlyHomeExpense) &&
      hasSetupFieldValue(values.monthlyPersonalBudget) &&
      hasSetupFieldValue(values.monthlyInvestment) &&
      hasSetupFieldValue(values.interestRate),
    "recurring-expenses": recurringExpenses.length > 0,
  } as Record<SetupStepId, boolean>;
  const canSubmit =
    completedSteps["starting-point"] &&
    completedSteps.income &&
    completedSteps["monthly-plan"];

  const summary = {
    startingBalance: parseNumber(values.startingBalance),
    monthlyIncome: parseNumber(values.estimatedSalary),
    plannedExpenses: parseNumber(values.monthlyHomeExpense) + parseNumber(values.monthlyPersonalBudget),
    monthlyInvestment: parseNumber(values.monthlyInvestment),
    estimatedMonthlySavings:
      parseNumber(values.estimatedSalary) -
      parseNumber(values.monthlyHomeExpense) -
      parseNumber(values.monthlyPersonalBudget) -
      parseNumber(values.monthlyInvestment),
    estimatedExtraPayment: parseNumber(values.estimatedExtraPayment),
  };

  const renderNumericInput = (field: { key: NumericField; label: string; placeholder: string }) => (
    <div className="space-y-2">
      <label className="text-sm font-medium text-[#273951]" htmlFor={field.key}>
        {field.label}
      </label>
      <Input
        id={field.key}
        type="text"
        inputMode="decimal"
        value={values[field.key]}
        onChange={(event) => setValues((prev) => ({ ...prev, [field.key]: event.target.value }))}
        placeholder={field.placeholder}
        disabled={submitting}
        className="h-11 rounded-md border-[#e5edf5] px-3 text-sm text-[#061b31] shadow-none focus-visible:ring-[#533afd]/20"
      />
    </div>
  );

  const summaryRows = [
    {
      label: t("summary.startingBalance"),
      value: formatCurrency(summary.startingBalance, locale),
      note: !startingBalanceEditable
        ? t("summary.startingBalanceLinked", { previousYear: previousYear ?? "" })
        : null,
    },
    {
      label: t("summary.monthlyIncome"),
      value: formatCurrency(summary.monthlyIncome, locale),
      note: null,
    },
    {
      label: t("summary.plannedExpenses"),
      value: formatCurrency(summary.plannedExpenses, locale),
      note: null,
    },
    {
      label: t("summary.monthlyInvestment"),
      value: formatCurrency(summary.monthlyInvestment, locale),
      note: null,
    },
    {
      label: t("summary.monthlySavings"),
      value: formatCurrency(summary.estimatedMonthlySavings, locale),
      note: null,
    },
    {
      label: t("summary.extraPays"),
      value: hasExtraPayments
        ? t("summary.extraPaysEnabled", { amount: formatCurrency(summary.estimatedExtraPayment, locale) })
        : t("summary.extraPaysDisabled"),
      note: null,
    },
  ];

  const summaryContent = (
    <div className="space-y-4">
      <div className="divide-y divide-[#e5edf5] rounded-md border border-[#e5edf5] bg-white">
        {summaryRows.map((row) => (
          <div key={row.label} className="flex items-start justify-between gap-4 px-3 py-3">
            <div className="min-w-0 space-y-1">
              <p className="text-xs font-medium text-[#64748d]">{row.label}</p>
              {row.note ? <p className="text-xs leading-5 text-[#64748d]">{row.note}</p> : null}
            </div>
            <p className="shrink-0 text-right text-sm font-medium tabular-nums text-[#061b31]">
              {row.value}
            </p>
          </div>
        ))}
      </div>
      <p className="rounded-md border border-[#d6d9fc] bg-[#533afd]/[0.04] px-3 py-2 text-xs leading-5 text-[#273951]">
        {t("summary.recurringNote")}
      </p>
    </div>
  );

  const errorAlert = error ? (
    <p
      role="alert"
      className="rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm leading-6 text-destructive"
    >
      {error}
    </p>
  ) : null;

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
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

      await createAndPrefillYear(payload);

      // Hard navigation to bypass all client caches
      window.location.href = `/${locale}${redirectTo}`;
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      setError(message === "Only the next year can be created" ? t("errorOnlyNextYear") : t("errorGeneric"));
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f6f9fc] px-4 py-6 text-[#061b31] sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-7xl space-y-6">
        <header className="rounded-lg border border-[#e5edf5] bg-white px-4 py-4 shadow-[0_15px_35px_0_rgba(23,23,23,0.08)] sm:px-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Image
                  src="/gridly-wordmark.svg"
                  alt="Gridly"
                  width={216}
                  height={64}
                  className="h-9 w-[122px]"
                  priority
                />
                {process.env.NODE_ENV === "development" && (
                  <Badge variant="default" className="pointer-events-none rounded uppercase">
                    DEV
                  </Badge>
                )}
              </div>
              <div className="max-w-2xl space-y-2">
                <p className="text-xs font-medium uppercase text-[#533afd]">
                  {t("headerEyebrow")}
                </p>
                <h1 className="text-3xl font-light leading-tight text-[#061b31] sm:text-4xl">
                  {t("mainHeading", { year })}
                </h1>
                <p className="text-sm leading-6 text-[#64748d] sm:text-base">
                  {startingBalanceEditable
                    ? t("descriptionEditable")
                    : t("descriptionFixed", { year, previousYear: previousYear ?? "" })}
                </p>
              </div>
            </div>
          </div>
        </header>

        <form onSubmit={handleSubmit} className="grid gap-4 lg:grid-cols-[12rem_minmax(0,1fr)_20rem] lg:items-start">
          <nav
            aria-label={t("stepperLabel")}
            className="sticky top-3 z-10 -mx-4 overflow-x-auto border-y border-[#e5edf5] bg-[#f6f9fc]/95 px-4 py-2 backdrop-blur lg:mx-0 lg:overflow-visible lg:rounded-lg lg:border lg:bg-white lg:p-2 lg:shadow-[0_15px_35px_0_rgba(23,23,23,0.06)]"
          >
            <ol className="flex min-w-max gap-2 lg:min-w-0 lg:flex-col">
              {SETUP_STEPS.map((step, index) => {
                const isStepOptional = step.id === "recurring-expenses";
                const isStepComplete = completedSteps[step.id];
                const showOptionalState = isStepOptional && !isStepComplete;

                return (
                <li key={step.id}>
                  <a
                    href={`#${step.id}`}
                    aria-current={isStepComplete ? "step" : undefined}
                    className={cn(
                      "flex h-10 items-center gap-2 rounded-md border px-3 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#533afd]/25",
                      showOptionalState
                        ? "border-dashed border-[#d6d9fc] bg-[#f6f9fc] text-[#64748d] hover:border-[#b9b9f9] hover:bg-[#533afd]/[0.04] hover:text-[#533afd]"
                        : isStepComplete
                        ? "border-[#15be53]/30 bg-[rgba(21,190,83,0.08)] text-[#108c3d] hover:border-[#15be53]/50 hover:bg-[rgba(21,190,83,0.12)]"
                        : "border-transparent text-[#273951] hover:border-[#d6d9fc] hover:bg-[#533afd]/[0.04] hover:text-[#533afd]"
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-5 shrink-0 items-center justify-center rounded border text-[11px] tabular-nums",
                        showOptionalState
                          ? "border-dashed border-[#b9b9f9] bg-white text-[#64748d]"
                          : isStepComplete
                          ? "border-[#15be53] bg-[#15be53] text-white"
                          : "border-[#d6d9fc] bg-white text-[#533afd]"
                      )}
                    >
                      {index + 1}
                    </span>
                    <span className="whitespace-nowrap">{t(step.labelKey)}</span>
                  </a>
                </li>
                );
              })}
            </ol>
          </nav>

          <main className="space-y-4">
            <Card id="starting-point" className="rounded-lg border-[#e5edf5] bg-white shadow-[rgba(50,50,93,0.25)_0px_30px_45px_-30px,rgba(0,0,0,0.1)_0px_18px_36px_-18px]">
              <CardHeader className="space-y-2 pb-4">
                <CardTitle className="text-2xl font-light text-[#061b31]">{t("sections.startingPoint.title")}</CardTitle>
                <CardDescription className="text-sm leading-6 text-[#64748d]">
                  {t("sections.startingPoint.description")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <label className="text-sm font-medium text-[#273951]" htmlFor="startingBalance">
                  {startingBalanceEditable ? t("startingBalanceLabel") : t("startingBalanceDerived")}
                </label>
                <Input
                  id="startingBalance"
                  type="text"
                  inputMode="decimal"
                  value={startingBalanceEditable ? values.startingBalance : formatCurrency(derivedStartingBalance, locale)}
                  onChange={(event) => setValues((prev) => ({ ...prev, startingBalance: event.target.value }))}
                  placeholder={t("startingBalancePlaceholder")}
                  disabled={submitting || !startingBalanceEditable}
                  className="h-11 rounded-md border-[#e5edf5] px-3 text-sm text-[#061b31] shadow-none focus-visible:ring-[#533afd]/20"
                />
                {!startingBalanceEditable ? (
                  <p className="text-sm leading-6 text-[#64748d]">
                    {t("startingBalanceNote", { previousYear: previousYear ?? "" })}
                  </p>
                ) : null}
              </CardContent>
            </Card>

            <Card id="income" className="rounded-lg border-[#e5edf5] bg-white shadow-[rgba(50,50,93,0.25)_0px_30px_45px_-30px,rgba(0,0,0,0.1)_0px_18px_36px_-18px]">
              <CardHeader className="space-y-2 pb-4">
                <CardTitle className="text-2xl font-light text-[#061b31]">{t("sections.income.title")}</CardTitle>
                <CardDescription className="text-sm leading-6 text-[#64748d]">
                  {t("sections.income.description")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {renderNumericInput(numericFieldByKey.estimatedSalary)}

                <div className="rounded-lg border border-[#e5edf5] bg-[#f6f9fc] p-4">
                  <label className="flex items-start justify-between gap-4">
                    <span className="space-y-1">
                      <span className="block text-sm font-medium text-[#273951]">
                        {t("hasExtraPayments")}
                      </span>
                      <span className="block text-sm leading-6 text-[#64748d]">
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
                          "inline-flex h-6 w-11 items-center rounded-full border p-0.5 transition-[background-color,box-shadow] duration-200 ease-out peer-focus-visible:ring-4 peer-focus-visible:ring-[#533afd]/20",
                          hasExtraPayments
                            ? "border-[#533afd]/70 bg-[#533afd] shadow-[0_8px_18px_-10px_rgba(83,58,253,0.7)]"
                            : "border-[#d4dee9] bg-white shadow-inner",
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
                      <div className="border-t border-[#e5edf5] pt-4">
                        <label className="block text-sm font-medium leading-5 text-[#273951]" htmlFor="estimatedExtraPayment">
                          {t("estimatedExtraPayment")}
                        </label>
                        <Input
                          id="estimatedExtraPayment"
                          type="text"
                          inputMode="decimal"
                          value={values.estimatedExtraPayment}
                          onChange={(event) =>
                            setValues((prev) => ({ ...prev, estimatedExtraPayment: event.target.value }))
                          }
                          placeholder={t("estimatedExtraPaymentPlaceholder")}
                          disabled={submitting || !hasExtraPayments}
                          className="mt-2 h-11 rounded-md border-[#e5edf5] px-3 text-sm text-[#061b31] shadow-none focus-visible:ring-[#533afd]/20"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card id="monthly-plan" className="rounded-lg border-[#e5edf5] bg-white shadow-[rgba(50,50,93,0.25)_0px_30px_45px_-30px,rgba(0,0,0,0.1)_0px_18px_36px_-18px]">
              <CardHeader className="space-y-2 pb-4">
                <CardTitle className="text-2xl font-light text-[#061b31]">{t("sections.monthlyPlan.title")}</CardTitle>
                <CardDescription className="text-sm leading-6 text-[#64748d]">
                  {t("sections.monthlyPlan.description")}
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-3">
                {renderNumericInput(numericFieldByKey.monthlyHomeExpense)}
                {renderNumericInput(numericFieldByKey.monthlyPersonalBudget)}
                {renderNumericInput(numericFieldByKey.monthlyInvestment)}
              </CardContent>
            </Card>

            <Card className="rounded-lg border-[#d6d9fc] bg-white shadow-[rgba(50,50,93,0.18)_0px_24px_40px_-30px,rgba(0,0,0,0.08)_0px_14px_28px_-18px]">
              <CardHeader className="space-y-2 pb-4">
                <CardTitle className="text-2xl font-light text-[#061b31]">{t("sections.growth.title")}</CardTitle>
                <CardDescription className="text-sm leading-6 text-[#64748d]">
                  {t("sections.growth.description")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {renderNumericInput(numericFieldByKey.interestRate)}
              </CardContent>
            </Card>

            <div id="recurring-expenses">
              <RecurringExpenseTemplateEditor
                entries={recurringExpenses}
                onChange={setRecurringExpenses}
                disabled={submitting}
                title={t("sections.recurringExpenses.title")}
                description={t("sections.recurringExpenses.description")}
              />
            </div>

            <Card id="review-create" className="rounded-lg border-[#e5edf5] bg-white shadow-[rgba(50,50,93,0.25)_0px_30px_45px_-30px,rgba(0,0,0,0.1)_0px_18px_36px_-18px] lg:hidden">
              <CardHeader className="space-y-2 pb-4">
                <CardTitle className="text-2xl font-light text-[#061b31]">{t("sections.reviewCreate.title")}</CardTitle>
                <CardDescription className="text-sm leading-6 text-[#64748d]">
                  {t("sections.reviewCreate.description")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {summaryContent}
                {errorAlert}
                <Button
                  type="submit"
                  className="h-11 w-full rounded-md bg-[#533afd] text-sm font-medium text-white hover:bg-[#4434d4]"
                  disabled={submitting || !canSubmit}
                  aria-busy={submitting}
                >
                  {submitting ? t("submitting") : t("submit")}
                </Button>
              </CardContent>
            </Card>
          </main>

          <aside className="hidden lg:sticky lg:top-3 lg:block">
            <Card className="rounded-lg border-[#e5edf5] bg-white shadow-[rgba(50,50,93,0.25)_0px_30px_45px_-30px,rgba(0,0,0,0.1)_0px_18px_36px_-18px]">
              <CardHeader className="space-y-2 pb-4">
                <CardTitle className="text-xl font-light text-[#061b31]">{t("summary.title")}</CardTitle>
                <CardDescription className="text-sm leading-6 text-[#64748d]">
                  {t("summary.description")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {summaryContent}
                {errorAlert}
                <Button
                  type="submit"
                  className="h-11 w-full rounded-md bg-[#533afd] text-sm font-medium text-white hover:bg-[#4434d4]"
                  disabled={submitting || !canSubmit}
                  aria-busy={submitting}
                >
                  {submitting ? t("submitting") : t("submit")}
                </Button>
              </CardContent>
            </Card>
          </aside>
        </form>
      </div>
    </div>
  );
}
