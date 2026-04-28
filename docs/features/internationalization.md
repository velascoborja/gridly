# Feature: Internationalization (i18n)

This document describes how Gridly handles multiple languages and localization.

## Overview

Gridly uses `next-intl` to provide a seamless internationalization experience using the Next.js App Router. It supports Spanish (default) and English.

## Implementation Details

- **Framework:** `next-intl` (v4+).
- **Configuration:** Located in `src/i18n/routing.ts` and `src/i18n/request.ts`.
- **Message Bundles:** Located in the `messages/` directory as JSON files (`es.json`, `en.json`).
- **Routing:** All routes are prefixed with the locale (e.g., `/es/2024/overview`).

## Message Structure

Messages are organized into namespaces (e.g., `Common`, `Annual`, `Monthly`, `Settings`) to keep the translation files maintainable.

```json
{
  "Common": {
    "settings": "Ajustes",
    "save": "Guardar"
  },
  "Annual": {
    "title": "Resumen anual"
  }
}
```

## Development Conventions

### Component Usage
Use the `useTranslations` hook for client and server components.

```tsx
import { useTranslations } from "next-intl";

export function MyComponent() {
  const t = useTranslations("Common");
  return <button>{t("save")}</button>;
}
```

### Navigation
Always use the custom navigation components and hooks exported from `@/i18n/routing` instead of the default `next/link` or `next/navigation`.

- `Link`: Automatically prefixes the `href` with the current locale.
- `useRouter`, `usePathname`, `redirect`: Locale-aware versions of Next.js utilities.
- Use `useRouter().refresh()` from `@/i18n/routing` after client-side mutations that need fresh App Router server payloads.

#### In-Year Routing & Workspace State
To provide a fast, app-like experience and preserve locally updated `YearData` across views, Gridly uses a "Workspace" model for in-year navigation:

- **State Persistence:** Navigation between months, the annual summary, and settings uses `window.history.pushState()` instead of standard router transitions. This prevents Next.js from refetching data and allows the `YearPageClient` to keep its local state (e.g., pending edits or recalculated balances) visible as the user switches tabs.
- **Shared Utilities:** All path parsing and URL generation must use the utilities in `src/lib/year-routes.ts` (e.g., `parseYearRoutePathname`, `buildYearMonthHref`). This ensures consistency between the URL and the client-side UI state.
- **Loading Stability:** The `BaseAppShell` and standardized `loading.tsx` files ensure that the header and background remain stable during navigation, avoiding layout shifts while the server is reached for initial page loads or hard refreshes.

```tsx
import { buildYearMonthHref } from "@/lib/year-routes";
import { getYearRoutePrefix } from "@/lib/year-routes";

// Example: local navigation to month 4
const prefix = getYearRoutePrefix(pathname, year);
window.history.pushState(null, "", buildYearMonthHref(prefix, year, 4));
```

### Adding New Strings
1.  Identify the appropriate namespace in `messages/es.json`.
2.  Add the key and the Spanish translation (Primary language).
3.  Add the same key to `messages/en.json` with the English translation.
4.  Use the key in your component.

## Localization Rules
- **UI Strings:** All user-facing text must be externalized to the message bundles.
- **Numbers & Currencies:** Use the `formatCurrency` utility from `@/lib/utils` or the `Intl` browser/node APIs.
- **Dates:** Use `Intl.DateTimeFormat` or `next-intl` date formatting utilities.
