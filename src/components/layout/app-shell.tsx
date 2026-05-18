"use client";

import { Search } from "lucide-react";
import { NavSelectors } from "./nav-selectors";
import { UserMenu } from "@/components/auth/user-menu";
import { BaseAppShell } from "./base-app-shell";
import { Button } from "@/components/ui/button";
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
  onSearchOpen?: () => void;
  children: React.ReactNode;
}

export function AppShell({
  currentYear,
  currentMonth,
  view,
  years,
  user,
  onMonthViewSelect,
  onSummaryViewSelect,
  onSettingsSelect,
  onSearchOpen,
  children,
}: Props) {
  return (
    <BaseAppShell
      headerRightContent={
        <>
          <div className="flex items-center justify-end justify-self-end gap-2">
            {onSearchOpen && (
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Search entries"
                onClick={onSearchOpen}
                className="text-muted-foreground hover:text-foreground"
              >
                <Search className="h-4 w-4" />
              </Button>
            )}
            <UserMenu
              email={user.email}
              name={user.name}
              image={user.image}
              active={view === "settings"}
              onSettingsSelect={onSettingsSelect}
            />
          </div>
          <div className="col-span-2 flex min-w-0 justify-center md:col-span-1 md:justify-end">
            <NavSelectors
              currentYear={currentYear}
              currentMonth={currentMonth}
              view={view}
              years={years}
              onMonthViewSelect={onMonthViewSelect}
              onSummaryViewSelect={onSummaryViewSelect}
            />
          </div>
        </>
      }
    >
      {children}
    </BaseAppShell>
  );
}
