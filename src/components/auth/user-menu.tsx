"use client";

import { signOut } from "@/lib/server/actions/auth";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { LogOut, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Props {
  email?: string | null;
  name?: string | null;
  image?: string | null;
  active?: boolean;
  variant?: "header" | "footer";
  onSettingsSelect?: () => void;
}

export function UserMenu({ email, name, image, active, variant = "header", onSettingsSelect }: Props) {
  const t = useTranslations("Common");
  const handleSettingsNavigate = (event: { preventDefault: () => void }) => {
    if (!onSettingsSelect) return;

    event.preventDefault();
    onSettingsSelect();
  };

  if (variant === "footer") {
    return (
      <div className="flex w-full max-w-sm flex-col gap-3 items-center">
        <div className="mb-2 flex flex-col items-center text-center">
          {image && (
            <div className="relative mb-2 size-12 overflow-hidden rounded-full border border-border/50 shadow-sm">
              <Image 
                src={image} 
                alt={name ?? ""} 
                fill
                className="object-cover"
                unoptimized
                referrerPolicy="no-referrer"
              />
            </div>
          )}
          <p className="text-sm font-medium text-foreground">{name ?? t("account")}</p>
          <p className="text-xs text-muted-foreground">{email}</p>
        </div>
        <Link
          href="/settings"
          onNavigate={handleSettingsNavigate}
          className={cn(
            "flex w-full items-center justify-center gap-2 rounded-lg border transition-all duration-200",
            active
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border/70 bg-background/85 text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <Settings className="size-4.5" />
          {t("settings")}
        </Link>
        
        <Dialog>
          <DialogTrigger render={
            <Button variant="outline" className="w-full border-destructive/20 text-destructive hover:bg-destructive/10 hover:text-destructive">
              {t("logout")}
            </Button>
          } />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("logout_confirm_title")}</DialogTitle>
              <DialogDescription>
                {t("logout_confirm_description")}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter showCloseButton={false}>
              <DialogClose render={<Button variant="outline" className="w-full sm:w-auto" />}>
                {t("cancel")}
              </DialogClose>
              <form action={signOut}>
                <Button type="submit" variant="destructive" className="w-full sm:w-auto">
                  {t("logout")}
                </Button>
              </form>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className="hidden min-w-0 text-right md:block">
        <p className="truncate text-sm font-medium text-foreground">{name ?? t("account")}</p>
        <p className="truncate text-xs text-muted-foreground">{email}</p>
      </div>
      {image && (
        <div className="relative size-9 overflow-hidden rounded-full border border-border/50 shadow-sm">
          <Image 
            src={image} 
            alt={name ?? ""} 
            fill
            className="object-cover"
            unoptimized
            referrerPolicy="no-referrer"
          />
        </div>
      )}
      <Link
        href="/settings"
        onNavigate={handleSettingsNavigate}
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
      
      <Dialog>
        <DialogTrigger render={
          <Button
            variant="outline"
            size="sm"
            className="h-9 w-9 rounded-full border-border/70 bg-background/85 px-0 sm:h-7 sm:w-auto sm:px-2.5"
            aria-label={t("logout")}
            title={t("logout")}
          >
            <LogOut className="size-4 sm:hidden" />
            <span className="hidden sm:inline">{t("logout")}</span>
          </Button>
        } />
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("logout_confirm_title")}</DialogTitle>
            <DialogDescription>
              {t("logout_confirm_description")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter showCloseButton={false}>
            <DialogClose render={<Button variant="outline" className="w-full sm:w-auto" />}>
              {t("cancel")}
            </DialogClose>
            <form action={signOut}>
              <Button type="submit" variant="destructive" className="w-full sm:w-auto">
                {t("logout")}
              </Button>
            </form>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
