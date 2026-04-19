"use client";

import { signOut } from "@/lib/server/actions/auth";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Settings } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  email?: string | null;
  name?: string | null;
  active?: boolean;
}

export function UserMenu({ email, name, active }: Props) {
  const t = useTranslations("Common");

  return (
    <div className="flex items-center gap-3">
      <div className="hidden min-w-0 text-right md:block">
        <p className="truncate text-sm font-medium text-foreground">{name ?? t("account")}</p>
        <p className="truncate text-xs text-muted-foreground">{email}</p>
      </div>
      <Link
        href="/settings"
        className={cn(
          "flex size-9 items-center justify-center rounded-full border transition-all duration-200 hover:shadow-sm",
          active
            ? "border-primary bg-primary text-primary-foreground"
            : "border-border/70 bg-background/85 text-muted-foreground hover:bg-muted hover:text-foreground"
        )}
        title={t("settings")}
      >
        <Settings className="size-4.5" />
      </Link>
      <form action={signOut}>
        <Button type="submit" variant="outline" size="sm" className="rounded-full border-border/70 bg-background/85">
          {t("logout")}
        </Button>
      </form>
    </div>
  );
}
