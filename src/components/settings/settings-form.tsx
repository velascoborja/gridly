"use client";

import { useTranslations, useLocale } from "next-intl";
import { useRouter, usePathname, routing } from "@/i18n/routing";
import { useState, useTransition } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Globe, Trash2, AlertCircle } from "lucide-react";

type DeleteConfirmationStep = "impact" | "typed";

export function SettingsForm() {
  const t = useTranslations("Settings");
  const common = useTranslations("Common");
  const locale = useLocale();
  const languageLabels: Record<string, string> = {
    es: t("spanish"),
    en: t("english"),
  };
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirmationStep, setDeleteConfirmationStep] =
    useState<DeleteConfirmationStep>("impact");
  const [deleteConfirmationText, setDeleteConfirmationText] = useState("");
  const requiredDeleteConfirmation = t("deleteAccountConfirmationPhrase");
  const canConfirmAccountDeletion = deleteConfirmationText.trim() === requiredDeleteConfirmation;

  function onLanguageChange(nextLocale: string | null) {
    if (!nextLocale) return;
    if (nextLocale === locale) return;

    startTransition(async () => {
      // 1. Update DB
      try {
        const res = await fetch("/api/user/settings", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ language: nextLocale }),
        });
        
        if (!res.ok) {
          throw new Error(`Failed to update settings: ${res.statusText}`);
        }
        
        console.log("Language updated in DB successfully:", nextLocale);
        router.refresh();
      } catch (err) {
        console.error("Failed to update language in DB:", err);
      }

      // 2. Change locale in client (using next-intl router)
      router.replace(pathname, { locale: nextLocale as (typeof routing.locales)[number] });
    });
  }

  async function handleDeleteAccount() {
    setDeleteError("");
    setIsDeleting(true);

    try {
      const res = await fetch("/api/user/settings", {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error(`Failed to delete account: ${res.statusText}`);
      }

      window.location.assign(`/${locale}?accountDeleted=1`);
    } catch (err) {
      console.error("Failed to delete account:", err);
      setDeleteError(t("deleteAccountError"));
      setIsDeleting(false);
    }
  }

  function handleDeleteDialogOpenChange(open: boolean) {
    if (isDeleting) return;

    setDeleteDialogOpen(open);
    if (!open) {
      setDeleteConfirmationStep("impact");
      setDeleteConfirmationText("");
    }
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
                <SelectValue placeholder={t("language")}>
                  {(value) => languageLabels[String(value)] ?? t("language")}
                </SelectValue>
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
          <div className="space-y-3">
            <AlertDialog open={deleteDialogOpen} onOpenChange={handleDeleteDialogOpenChange}>
              <AlertDialogTrigger
                render={
                  <Button
                    variant="destructive"
                    disabled={isDeleting}
                    className="gap-2 rounded-xl shadow-sm"
                  >
                    <Trash2 className="size-4" />
                    {common("deleteAccount")}
                  </Button>
                }
              />
              <AlertDialogContent>
                {deleteConfirmationStep === "impact" ? (
                  <>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{t("deleteAccountTitle")}</AlertDialogTitle>
                      <AlertDialogDescription>
                        {t("deleteAccountDialogDescription")}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel disabled={isDeleting}>
                        {common("cancel")}
                      </AlertDialogCancel>
                      <AlertDialogAction
                        variant="destructive"
                        onClick={() => setDeleteConfirmationStep("typed")}
                        disabled={isDeleting}
                        className="gap-2"
                      >
                        <AlertCircle className="size-4" />
                        {t("deleteAccountContinue")}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </>
                ) : (
                  <>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{t("deleteAccountSecondTitle")}</AlertDialogTitle>
                      <AlertDialogDescription>
                        {t("deleteAccountSecondDescription", {
                          phrase: requiredDeleteConfirmation,
                        })}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="space-y-2">
                      <label
                        htmlFor="delete-account-confirmation"
                        className="text-sm font-medium text-foreground"
                      >
                        {t("deleteAccountConfirmationLabel")}
                      </label>
                      <Input
                        id="delete-account-confirmation"
                        value={deleteConfirmationText}
                        onChange={(event) => setDeleteConfirmationText(event.target.value)}
                        disabled={isDeleting}
                        autoComplete="off"
                        aria-describedby="delete-account-confirmation-hint"
                      />
                      <p
                        id="delete-account-confirmation-hint"
                        className="text-xs text-muted-foreground"
                      >
                        {t("deleteAccountConfirmationHint", {
                          phrase: requiredDeleteConfirmation,
                        })}
                      </p>
                    </div>
                    <AlertDialogFooter>
                      <AlertDialogCancel disabled={isDeleting}>
                        {common("cancel")}
                      </AlertDialogCancel>
                      <AlertDialogAction
                        variant="destructive"
                        onClick={handleDeleteAccount}
                        disabled={isDeleting || !canConfirmAccountDeletion}
                        aria-busy={isDeleting}
                        className="gap-2"
                      >
                        <Trash2 className="size-4" />
                        {isDeleting ? t("deleteAccountDeleting") : common("deleteAccount")}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </>
                )}
              </AlertDialogContent>
            </AlertDialog>
            {deleteError ? (
              <p className="text-sm text-destructive" role="alert">
                {deleteError}
              </p>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
