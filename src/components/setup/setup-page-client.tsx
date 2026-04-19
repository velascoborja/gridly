"use client";

import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";

interface Field {
  key: string;
  label: string;
  defaultValue: string;
}

const FIELDS: Field[] = [
  { key: "estimatedSalary", label: "Salario mensual estimado (€)", defaultValue: "0" },
  { key: "monthlyHomeExpense", label: "Gasto hogar mensual (€)", defaultValue: "0" },
  { key: "monthlyPersonalBudget", label: "Presupuesto personal mensual (€)", defaultValue: "0" },
  { key: "monthlyInvestment", label: "Inversión mensual (€)", defaultValue: "0" },
  { key: "interestRate", label: "Tipo de interés anual (%)", defaultValue: "0" },
];

interface Props {
  year: number;
  derivedStartingBalance: number;
  previousYear: number | null;
  startingBalanceEditable: boolean;
}

export function SetupPageClient({ year, derivedStartingBalance, previousYear, startingBalanceEditable }: Props) {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") ?? `/${year}/${new Date().getMonth() + 1}`;
  const router = useRouter();

  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries([
      ["startingBalance", String(derivedStartingBalance)],
      ...FIELDS.map((f) => [f.key, f.defaultValue]),
    ])
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    const body: Record<string, number | string> = { year };
    for (const f of FIELDS) {
      const val = parseFloat(values[f.key].replace(",", "."));
      body[f.key] = Number.isNaN(val) ? 0 : f.key === "interestRate" ? val / 100 : val;
    }

    try {
      const res = await fetch("/api/years", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        setError(
          payload?.error === "Only the next year can be created"
            ? "Solo puedes crear el siguiente ejercicio disponible."
            : "No se ha podido crear el año. Revisa los datos e inténtalo de nuevo."
        );
        setSubmitting(false);
        return;
      }

      await fetch(`/api/years/${year}/prefill`, { method: "POST" });
      router.push(redirectTo);
    } catch {
      setError("No se ha podido crear el año. Revisa la conexión e inténtalo de nuevo.");
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(64,148,255,0.12),transparent_32%),radial-gradient(circle_at_top_right,rgba(16,185,129,0.08),transparent_28%),linear-gradient(180deg,rgba(248,250,252,0.96),rgba(255,255,255,1))] px-4 py-8 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center gap-6 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)]">
        <section className="relative overflow-hidden rounded-[2rem] border border-border/70 bg-[linear-gradient(145deg,rgba(15,23,42,0.94),rgba(37,99,235,0.88))] px-6 py-8 text-primary-foreground shadow-[0_36px_100px_-48px_rgba(15,23,42,0.75)] sm:px-8 sm:py-10">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.18),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.18),transparent_22%)]" />
          <div className="pointer-events-none absolute -right-24 top-10 size-56 rounded-full bg-white/10 blur-3xl" />
          <div className="relative flex h-full flex-col justify-between gap-10">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <span className="flex size-11 items-center justify-center rounded-2xl bg-white text-sm font-semibold text-slate-950 shadow-[0_14px_30px_-18px_rgba(255,255,255,0.55)]">
                  G
                </span>
                <div className="space-y-0.5">
                  <p className="text-xs font-semibold uppercase tracking-[0.26em] text-white/70">
                    Gridly
                  </p>
                  <p className="text-sm text-white/70">Arranque del año financiero</p>
                </div>
              </div>
              <div className="max-w-xl space-y-4">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/65">
                  Configuración guiada
                </p>
                <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
                  Prepara {year} con una sola pantalla
                </h1>
                <p className="max-w-lg text-sm leading-6 text-white/75 sm:text-base">
                  {startingBalanceEditable
                    ? "Define el punto de partida del año, el salario estimado y los gastos fijos. Gridly rellena automáticamente los meses y mantiene el flujo mensual conectado."
                    : `Solo puedes crear el siguiente ejercicio disponible. Gridly arranca ${year} con la previsión de cierre de ${previousYear}.`}
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/8 p-4 backdrop-blur-sm">
                <p className="text-xs uppercase tracking-[0.22em] text-white/55">Saldo inicial</p>
                <p className="mt-2 text-sm font-medium text-white">
                  {startingBalanceEditable ? "Arranca con contexto real" : formatCurrency(derivedStartingBalance)}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/8 p-4 backdrop-blur-sm">
                <p className="text-xs uppercase tracking-[0.22em] text-white/55">Pagas extra</p>
                <p className="mt-2 text-sm font-medium text-white">Junio y diciembre se ajustan solos</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/8 p-4 backdrop-blur-sm">
                <p className="text-xs uppercase tracking-[0.22em] text-white/55">Redirección</p>
                <p className="mt-2 text-sm font-medium text-white">Vuelve al flujo donde estabas</p>
              </div>
            </div>
          </div>
        </section>

        <Card className="rounded-[2rem] border-border/70 bg-background/90 shadow-[0_30px_80px_-44px_rgba(15,23,42,0.45)] backdrop-blur-xl">
          <CardHeader className="gap-2 pb-0">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              Paso 1 de 1
            </p>
            <CardTitle className="text-2xl sm:text-3xl">Configurar {year}</CardTitle>
            <CardDescription className="text-sm leading-6 sm:text-base">
              {startingBalanceEditable
                ? "Introduce las estimaciones para el año. Podrás ajustarlas en cualquier momento."
                : `Saldo inicial enlazado a ${previousYear}: ${formatCurrency(derivedStartingBalance)}.`}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  {startingBalanceEditable ? "Saldo de apertura del año (€)" : "Saldo inicial derivado"}
                </label>
                <Input
                  type="text"
                  inputMode="decimal"
                  value={values.startingBalance}
                  onChange={(e) => setValues((prev) => ({ ...prev, startingBalance: e.target.value }))}
                  disabled={submitting || !startingBalanceEditable}
                  className="h-11 rounded-xl px-4 text-sm"
                />
                {!startingBalanceEditable ? (
                  <p className="text-sm leading-6 text-muted-foreground">
                    Solo puedes crear el siguiente ejercicio y su saldo inicial se calcula automáticamente desde {previousYear}.
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
                    disabled={submitting}
                    className="h-11 rounded-xl px-4 text-sm"
                  />
                </div>
              ))}

              {error ? (
                <p
                  role="alert"
                  className="rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm leading-6 text-destructive"
                >
                  {error}
                </p>
              ) : null}

              <Button type="submit" className="h-11 w-full rounded-xl text-sm font-semibold" disabled={submitting}>
                {submitting ? "Creando…" : "Crear y rellenar estimaciones"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
