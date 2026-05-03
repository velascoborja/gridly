"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { RecurringExpenseTemplateEditor } from "@/components/recurring-expenses/recurring-expense-template-editor";
import type { RecurringExpenseInput } from "@/lib/recurring-expenses";
import { cn, formatCurrency } from "@/lib/utils";
import { createAndPrefillYear } from "@/lib/server/actions/years";

interface Field {
  key: string;
  label: string;
  placeholder: string;
}

interface Props {
  year: number;
  derivedStartingBalance: number;
  previousYear: number | null;
  startingBalanceEditable: boolean;
}

export function SetupPageClient({ year, derivedStartingBalance, previousYear, startingBalanceEditable }: Props) {
  const t = useTranslations("Setup");
  const locale = useLocale();
  const searchParams = useSearchParams();
  const redirectTo =
    searchParams.get("redirect") ?? `/${year}/${new Date().getMonth() + 1}`;

  const FIELDS: Field[] = [
    { key: "estimatedSalary", label: t("estimatedSalary"), placeholder: t("estimatedSalaryPlaceholder") },
    { key: "monthlyHomeExpense", label: t("monthlyHomeExpense"), placeholder: t("monthlyHomeExpensePlaceholder") },
    { key: "monthlyPersonalBudget", label: t("monthlyPersonalBudget"), placeholder: t("monthlyPersonalBudgetPlaceholder") },
    { key: "monthlyInvestment", label: t("monthlyInvestment"), placeholder: t("monthlyInvestmentPlaceholder") },
    { key: "interestRate", label: t("interestRate"), placeholder: t("interestRatePlaceholder") },
  ];

  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries([
      ["startingBalance", startingBalanceEditable ? "" : String(derivedStartingBalance)],
      ["estimatedExtraPayment", ""],
      ...FIELDS.map((f) => [f.key, ""]),
    ])
  );
  const [hasExtraPayments, setHasExtraPayments] = useState(false);
  const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpenseInput[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const startingBalance = parseFloat(values.startingBalance.replace(",", "."));
      const estimatedExtraPayment = parseFloat(values.estimatedExtraPayment.replace(",", "."));
      
      const payload = {
        year,
        startingBalance: Number.isNaN(startingBalance) ? 0 : startingBalance,
        estimatedSalary: parseFloat(values.estimatedSalary.replace(",", ".")) || 0,
        hasExtraPayments,
        estimatedExtraPayment: hasExtraPayments && !Number.isNaN(estimatedExtraPayment) ? estimatedExtraPayment : 0,
        monthlyInvestment: parseFloat(values.monthlyInvestment.replace(",", ".")) || 0,
        monthlyHomeExpense: parseFloat(values.monthlyHomeExpense.replace(",", ".")) || 0,
        monthlyPersonalBudget: parseFloat(values.monthlyPersonalBudget.replace(",", ".")) || 0,
        interestRate: (parseFloat(values.interestRate.replace(",", ".")) || 0) / 100,
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
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(64,148,255,0.12),transparent_32%),radial-gradient(circle_at_top_right,rgba(16,185,129,0.08),transparent_28%),linear-gradient(180deg,rgba(248,250,252,0.96),rgba(255,255,255,1))] px-4 py-8 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-6xl items-start gap-6 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)]">
        <section className="relative overflow-hidden rounded-[2rem] border border-border/70 bg-[linear-gradient(145deg,rgba(15,23,42,0.94),rgba(37,99,235,0.88))] px-6 py-8 text-primary-foreground shadow-[0_36px_100px_-48px_rgba(15,23,42,0.75)] sm:px-8 sm:py-10">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.18),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.18),transparent_22%)]" />
          <div className="pointer-events-none absolute -right-24 top-10 size-56 rounded-full bg-white/10 blur-3xl" />
          <div className="relative flex h-full flex-col justify-between gap-10">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-white/94 px-3 py-2 shadow-[0_18px_36px_-24px_rgba(255,255,255,0.55)]">
                  <Image
                    src="/gridly-wordmark.svg"
                    alt="Gridly"
                    width={216}
                    height={64}
                    className="h-10 w-[135px]"
                    priority
                  />
                  {process.env.NODE_ENV === "development" && (
                    <Badge variant="default" className="pointer-events-none uppercase">
                      DEV
                    </Badge>
                  )}
                </div>
                <div className="space-y-0.5">
                  <p className="text-sm text-white/70">{t("subtitle")}</p>
                </div>
              </div>
              <div className="max-w-xl space-y-4">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/65">
                  {t("guidedConfig")}
                </p>
                <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
                  {t("mainHeading", { year })}
                </h1>
                <p className="max-w-lg text-sm leading-6 text-white/75 sm:text-base">
                  {startingBalanceEditable
                    ? t("descriptionEditable")
                    : t("descriptionFixed", { year, previousYear: previousYear ?? "" })}
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/8 p-4 backdrop-blur-sm">
                <p className="text-xs uppercase tracking-[0.22em] text-white/55">{t("startingBalanceDerived")}</p>
                <p className="mt-2 text-sm font-medium text-white">
                  {startingBalanceEditable ? t("startingBalanceReal") : formatCurrency(derivedStartingBalance, locale)}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/8 p-4 backdrop-blur-sm">
                <p className="text-xs uppercase tracking-[0.22em] text-white/55">{t("extraPaysLabel")}</p>
                <p className="mt-2 text-sm font-medium text-white">
                  {hasExtraPayments ? t("extraPaysEnabledNote") : t("extraPaysDisabledNote")}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/8 p-4 backdrop-blur-sm">
                <p className="text-xs uppercase tracking-[0.22em] text-white/55">{t("redirectionLabel")}</p>
                <p className="mt-2 text-sm font-medium text-white">{t("redirectionNote")}</p>
              </div>
            </div>
          </div>
        </section>

        <Card className="rounded-[2rem] border-border/70 bg-background/90 shadow-[0_30px_80px_-44px_rgba(15,23,42,0.45)] backdrop-blur-xl">
          <CardHeader className="gap-2 pb-0">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              {t("stepCounter")}
            </p>
            <CardTitle className="text-2xl sm:text-3xl">{t("title", { year })}</CardTitle>
            <CardDescription className="text-sm leading-6 sm:text-base">
              {startingBalanceEditable
                ? t("formDescriptionEditable")
                : t("formDescriptionFixed", { previousYear: previousYear ?? "", balance: formatCurrency(derivedStartingBalance, locale) })}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  {startingBalanceEditable ? t("startingBalanceLabel") : t("startingBalanceDerived")}
                </label>
                <Input
                  type="text"
                  inputMode="decimal"
                  value={values.startingBalance}
                  onChange={(e) => setValues((prev) => ({ ...prev, startingBalance: e.target.value }))}
                  placeholder={t("startingBalancePlaceholder")}
                  disabled={submitting || !startingBalanceEditable}
                  className="h-11 rounded-xl px-4 text-sm"
                />
                {!startingBalanceEditable ? (
                  <p className="text-sm leading-6 text-muted-foreground">
                    {t("startingBalanceNote", { previousYear: previousYear ?? "" })}
                  </p>
                ) : null}
              </div>

              {FIELDS.map((f) => (
                <div key={f.key} className="space-y-2">
                  <label className="text-sm font-medium text-foreground">{f.label}</label>
                  <Input
                    type="text"
                    inputMode="decimal"
                    value={values[f.key]}
                    onChange={(e) => setValues((prev) => ({ ...prev, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    disabled={submitting}
                    className="h-11 rounded-xl px-4 text-sm"
                  />
                </div>
              ))}

              <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                <label className="flex items-start justify-between gap-4">
                  <span className="space-y-1">
                    <span className="block text-sm font-medium text-foreground">
                      {t("hasExtraPayments")}
                    </span>
                    <span className="block text-sm leading-6 text-muted-foreground">
                      {t("hasExtraPaymentsDescription")}
                    </span>
                  </span>
                  <span className="relative mt-1 inline-flex shrink-0 items-center">
                    <input
                      type="checkbox"
                      role="switch"
                      checked={hasExtraPayments}
                      onChange={(e) => setHasExtraPayments(e.target.checked)}
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
                        onChange={(e) =>
                          setValues((prev) => ({ ...prev, estimatedExtraPayment: e.target.value }))
                        }
                        placeholder={t("estimatedExtraPaymentPlaceholder")}
                        disabled={submitting || !hasExtraPayments}
                        className="mt-5 h-11 rounded-xl px-4 text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <RecurringExpenseTemplateEditor
                entries={recurringExpenses}
                onChange={setRecurringExpenses}
                disabled={submitting}
                title={t("recurringExpensesTitle")}
                description={t("recurringExpensesDescription")}
              />

              {error ? (
                <p
                  role="alert"
                  className="rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm leading-6 text-destructive"
                >
                  {error}
                </p>
              ) : null}

              <Button type="submit" className="h-11 w-full rounded-xl text-sm font-semibold" disabled={submitting}>
                {submitting ? t("submitting") : t("submit")}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
