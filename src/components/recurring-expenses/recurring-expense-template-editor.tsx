"use client";

import { useTranslations } from "next-intl";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { RecurringExpenseInput } from "@/lib/recurring-expenses";

interface Props {
  entries: RecurringExpenseInput[];
  onChange: (entries: RecurringExpenseInput[]) => void;
  disabled?: boolean;
  title: string;
  description: string;
}

export function RecurringExpenseTemplateEditor({
  entries,
  onChange,
  disabled = false,
  title,
  description,
}: Props) {
  const t = useTranslations("RecurringExpenses.editor");

  const updateEntry = (index: number, patch: Partial<RecurringExpenseInput>) => {
    onChange(entries.map((entry, entryIndex) => entryIndex === index ? { ...entry, ...patch } : entry));
  };

  const removeEntry = (index: number) => {
    onChange(entries.filter((_, entryIndex) => entryIndex !== index));
  };

  return (
    <section className="rounded-2xl border border-border/70 bg-muted/20 p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-sm font-medium text-foreground">{title}</h3>
          <p className="text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={() => onChange([...entries, { label: "", amount: 0 }])}
          className="shrink-0 border-primary/20 bg-background/80 text-primary hover:bg-primary/[0.06]"
        >
          <Plus className="h-3.5 w-3.5" />
          {t("add")}
        </Button>
      </div>

      <div className="mt-4 space-y-2">
        {entries.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/70 bg-background/50 px-3 py-3 text-sm text-muted-foreground">
            {t("empty")}
          </div>
        ) : null}

        {entries.map((entry, index) => (
          <div key={index} className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_8rem_auto]">
            <Input
              value={entry.label}
              placeholder={t("labelPlaceholder")}
              disabled={disabled}
              onChange={(event) => updateEntry(index, { label: event.target.value })}
              className="h-10 text-sm"
            />
            <Input
              value={entry.amount === 0 ? "" : String(entry.amount)}
              placeholder="0.00"
              inputMode="decimal"
              disabled={disabled}
              onChange={(event) => {
                const amount = parseFloat(event.target.value.replace(",", "."));
                updateEntry(index, { amount: Number.isNaN(amount) ? 0 : amount });
              }}
              className="h-10 text-right text-sm"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              disabled={disabled}
              onClick={() => removeEntry(index)}
              aria-label={t("remove")}
              className="h-10 w-full text-muted-foreground hover:text-destructive sm:w-10"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </section>
  );
}
