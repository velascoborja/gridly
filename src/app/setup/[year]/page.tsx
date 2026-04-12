"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { use } from "react";

interface Field {
  key: string;
  label: string;
  defaultValue: string;
}

const FIELDS: Field[] = [
  { key: "startingBalance", label: "Saldo inicial del año (€)", defaultValue: "0" },
  { key: "estimatedSalary", label: "Salario mensual estimado (€)", defaultValue: "0" },
  { key: "monthlyHomeExpense", label: "Gasto hogar mensual (€)", defaultValue: "0" },
  { key: "monthlyPersonalBudget", label: "Presupuesto personal mensual (€)", defaultValue: "0" },
  { key: "monthlyInvestment", label: "Inversión mensual (€)", defaultValue: "0" },
  { key: "interestRate", label: "Tipo de interés anual (%)", defaultValue: "0" },
];

export default function SetupPage({ params }: { params: Promise<{ year: string }> }) {
  const { year } = use(params);
  const yearNum = parseInt(year, 10);
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") ?? `/${year}/${new Date().getMonth() + 1}`;
  const router = useRouter();

  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(FIELDS.map((f) => [f.key, f.defaultValue]))
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    const body: Record<string, number | string> = { year: yearNum };
    for (const f of FIELDS) {
      const val = parseFloat(values[f.key].replace(",", "."));
      body[f.key] = isNaN(val) ? 0 : (f.key === "interestRate" ? val / 100 : val);
    }

    const res = await fetch("/api/years", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      setError("Error al crear el año. ¿Ya existe?");
      setSubmitting(false);
      return;
    }

    // Prefill months
    await fetch(`/api/years/${yearNum}/prefill`, { method: "POST" });

    router.push(redirectTo);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Configurar {yearNum}</CardTitle>
          <p className="text-sm text-muted-foreground">
            Introduce las estimaciones para el año. Podrás ajustarlas en cualquier momento.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {FIELDS.map((f) => (
              <div key={f.key} className="space-y-1">
                <label className="text-sm font-medium">{f.label}</label>
                <Input
                  type="text"
                  inputMode="decimal"
                  value={values[f.key]}
                  onChange={(e) => setValues((prev) => ({ ...prev, [f.key]: e.target.value }))}
                />
              </div>
            ))}
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Creando…" : "Crear y rellenar estimaciones"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
