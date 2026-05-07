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

function MoneyInput({
  id,
  value,
  onChange,
  disabled,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
}) {
  return (
    <div className="relative">
      <Input
        className="h-9 pr-8"
        id={id}
        inputMode="decimal"
        placeholder="0.00"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground/70"
      >
        €
      </span>
    </div>
  );
}

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
      <DialogContent className="gap-5 p-5 sm:max-w-md sm:p-6">
        <DialogHeader className="gap-1 pr-10">
          <DialogTitle className="text-lg">{mode === "edit" ? t("editTitle") : t("createTitle")}</DialogTitle>
          <DialogDescription className="text-sm leading-5">{t("description")}</DialogDescription>
        </DialogHeader>
        <form className="space-y-3" onSubmit={handleSubmit} aria-busy={submitting}>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground" htmlFor="historical-year">{t("year")}</label>
            <Input
              id="historical-year"
              className="h-9"
              inputMode="numeric"
              value={values.year}
              onChange={(event) => setValues((prev) => ({ ...prev, year: event.target.value.replace(/\D/g, "") }))}
              disabled={submitting}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground" htmlFor="historical-starting-balance">{t("startingBalance")}</label>
            <MoneyInput id="historical-starting-balance" value={values.startingBalance} onChange={(value) => updateCurrency("startingBalance", value)} disabled={submitting} />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground" htmlFor="historical-final-balance">{t("finalBalance")}</label>
            <MoneyInput id="historical-final-balance" value={values.finalBalance} onChange={(value) => updateCurrency("finalBalance", value)} disabled={submitting} />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground" htmlFor="historical-invested-amount">{t("investedAmount")}</label>
            <MoneyInput id="historical-invested-amount" value={values.investedAmount} onChange={(value) => updateCurrency("investedAmount", value)} disabled={submitting} />
          </div>
          <div className="rounded-md border border-primary/20 bg-primary/[0.05] px-3 py-2 text-sm leading-5">
            <span className="text-muted-foreground">{t("savedPreview")}</span>
            <span className="finance-number ml-2 text-foreground">{formatCurrency(savedPreview, locale)}</span>
          </div>
          {error ? <p role="alert" className="rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p> : null}
          <DialogFooter className="-mx-5 -mb-5 px-5 py-3 sm:-mx-6 sm:-mb-6 sm:px-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>{t("cancel")}</Button>
            <Button type="submit" disabled={submitting}>{submitting ? t("submitting") : mode === "edit" ? t("save") : t("create")}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
