# Logout Confirmation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a confirmation dialog before logging out to prevent accidental session termination.

**Architecture:** Use the existing `@base-ui/react/dialog` based `Dialog` component in `UserMenu` to wrap the logout form.

**Tech Stack:** React 19, Next.js 16 (App Router), next-intl, `@base-ui/react`.

---

### Task 1: Add Translations

**Files:**
- Modify: `messages/es.json`
- Modify: `messages/en.json`

- [ ] **Step 1: Add Spanish translations**

```json
{
  "Common": {
    "logout_confirm_title": "¿Cerrar sesión?",
    "logout_confirm_description": "¿Estás seguro de que quieres salir? Tendrás que volver a identificarte para acceder a tus datos.",
    "cancel": "Cancelar"
  }
}
```

- [ ] **Step 2: Add English translations**

```json
{
  "Common": {
    "logout_confirm_title": "Log out?",
    "logout_confirm_description": "Are you sure you want to log out? You will need to sign in again to access your data.",
    "cancel": "Cancel"
  }
}
```

- [ ] **Step 3: Commit translations**

```bash
git add messages/es.json messages/en.json
git commit -m "i18n: add logout confirmation translations"
```

---

### Task 2: Implement Logout Confirmation Dialog

**Files:**
- Modify: `src/components/auth/user-menu.tsx`

- [ ] **Step 1: Update imports and implement Dialog**

```tsx
"use client";

import { signOut } from "@/lib/server/actions/auth";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
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
      
      <Dialog>
        <DialogTrigger render={
          <Button variant="outline" size="sm" className="rounded-full border-border/70 bg-background/85">
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
```

- [ ] **Step 2: Verify build**

Run: `npm run build` (or `npx tsc` to check types)

- [ ] **Step 3: Commit implementation**

```bash
git add src/components/auth/user-menu.tsx
git commit -m "feat: add logout confirmation dialog"
```
