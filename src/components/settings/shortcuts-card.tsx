"use client";

import { Fragment, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Keyboard } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

type ShortcutDef = { keys: string[]; action: string };
type GroupDef = { label: string; shortcuts: ShortcutDef[] };

export function ShortcutsCard() {
  const t = useTranslations("KeyboardShortcuts");
  const [mod, setMod] = useState("⌘");

  useEffect(() => {
    if (!navigator.userAgent.includes("Mac")) {
      setMod("Ctrl");
    }
  }, []);

  const groups: GroupDef[] = [
    {
      label: t("groupGlobal"),
      shortcuts: [
        { keys: [mod, "K"], action: t("openSearch") },
        { keys: [mod, "1"], action: t("viewMonths") },
        { keys: [mod, "2"], action: t("viewYears") },
        { keys: [mod, "3"], action: t("viewEvolution") },
      ],
    },
    {
      label: t("groupMonthNav"),
      shortcuts: [
        { keys: [mod, "⇧", "←"], action: t("prevMonth") },
        { keys: [mod, "⇧", "→"], action: t("nextMonth") },
        { keys: [mod, "B"], action: t("goToCurrentMonth") },
      ],
    },
    {
      label: t("groupEntries"),
      shortcuts: [
        { keys: [mod, "⇧", "E"], action: t("addExpense") },
        { keys: [mod, "⇧", "I"], action: t("addIncome") },
        { keys: [mod, "⇧", "G"], action: t("createGroup") },
        { keys: [mod, "⇧", "."], action: t("toggleGroups") },
        { keys: [mod, "."], action: t("toggleFixed") },
      ],
    },
  ];

  return (
    <Card className="border-border/70 bg-background/85 shadow-sm">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Keyboard className="size-5 text-primary" />
          <CardTitle>{t("title")}</CardTitle>
        </div>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-2">
          {groups.map((group) => (
            <Fragment key={group.label}>
              <div className="col-span-2 pb-1 pt-3 text-[9.5px] font-bold uppercase tracking-widest text-muted-foreground">
                {group.label}
              </div>
              {group.shortcuts.map((shortcut) => (
                <div
                  key={shortcut.action}
                  className="flex items-center gap-2 rounded-md px-1.5 py-1.5 hover:bg-muted/50"
                >
                  <div className="flex min-w-[72px] items-center gap-0.5">
                    {shortcut.keys.map((key, i) => (
                      <kbd
                        key={i}
                        className="inline-flex items-center justify-center rounded-[5px] border border-b-2 border-border bg-muted px-1.5 py-0.5 font-mono text-[10.5px] text-foreground/70 shadow-sm"
                      >
                        {key}
                      </kbd>
                    ))}
                  </div>
                  <span className="text-sm text-foreground/80">
                    {shortcut.action}
                  </span>
                </div>
              ))}
            </Fragment>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
