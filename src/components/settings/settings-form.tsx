"use client";

import { useTranslations, useLocale } from "next-intl";
import { useRouter, usePathname, routing } from "@/i18n/routing";
import { useTransition } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Globe, Trash2, AlertCircle } from "lucide-react";

export function SettingsForm() {
  const t = useTranslations("Settings");
  const common = useTranslations("Common");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  function onLanguageChange(nextLocale: string | null) {
    if (!nextLocale) return;
    startTransition(async () => {
      // 1. Update DB
      try {
        await fetch("/api/user/settings", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ language: nextLocale }),
        });
      } catch (err) {
        console.error("Failed to update language in DB:", err);
      }

      // 2. Change locale in client (using next-intl router)
      // We use router.replace(pathname, { locale: nextLocale }) to update the locale
      router.replace(pathname, { locale: nextLocale as (typeof routing.locales)[number] });
    });
  }

  function handleDeleteAccount() {
    alert(t("todoDeleteAccount"));
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Card className="border-border/70 bg-background/85 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Globe className="size-5 text-primary" />
            <CardTitle>{t("title")}</CardTitle>
          </div>
          <CardDescription>
            {t("language")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-w-xs">
            <Select 
              value={locale} 
              onValueChange={onLanguageChange}
              disabled={isPending}
            >
              <SelectTrigger className="h-10 rounded-xl border-border/70 bg-background/90 shadow-sm transition-all focus:border-primary focus:ring-primary/20">
                <SelectValue placeholder={t("language")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="es">{t("spanish")}</SelectItem>
                <SelectItem value="en">{t("english")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="border-destructive/20 bg-destructive/[0.02] shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="size-5" />
            <CardTitle>{t("dangerZone")}</CardTitle>
          </div>
          <CardDescription>
            {t("deleteAccountConfirm")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            variant="destructive" 
            onClick={handleDeleteAccount}
            className="gap-2 rounded-xl shadow-sm"
          >
            <Trash2 className="size-4" />
            {common("deleteAccount")}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
