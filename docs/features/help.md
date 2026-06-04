# Feature: Help Page

The Help page (`/help`) is a static, tabbed reference guide that explains every feature in Gridly. It is accessible from the Settings page via the "Ayuda" / "Help" card.

## Entry Point

A `HelpCard` in `src/components/settings/settings-form.tsx` (rendered above the `ShortcutsCard`) contains a button that navigates to `/help`.

## Structure

The page uses four tabs:

| Tab | Content |
|---|---|
| **Meses** | Fixed income & expenses, extra payments, interest, recurring expenses, additional entries, expense groups, tags, month navigation, balance chain |
| **Año** | Annual summary table, charts, additional entries averages, Excel export |
| **Evolución** | KPI panel, trend charts, historical imports, category analysis, future years toggle, estimated returns |
| **Ajustes** | Year configuration, recurring template, tag management, language, keyboard shortcuts, account deletion |

Each tab renders a vertical list of `HelpFeatureRow` components. Each row shows a feature name and one-sentence summary, with an expand/collapse chevron button that reveals a 2–4 sentence detail paragraph.

## Components

| File | Role |
|---|---|
| `src/app/[locale]/help/page.tsx` | Route — server component; fetches user + year list for AppShell nav |
| `src/components/help/help-page-client.tsx` | Tab state + feature data arrays |
| `src/components/help/help-feature-row.tsx` | Individual expandable feature row |
| `src/components/settings/help-card.tsx` | Settings entry card |

## i18n

All strings live in the `Help` namespace in `messages/es.json` and `messages/en.json`. Keys follow the pattern `<featureId>Title`, `<featureId>Summary`, `<featureId>Detail` for each feature row, plus top-level keys for the page header, tab labels, card copy, and expand/collapse labels.

## AppShell Integration

The help page passes `view="settings"` to `AppShell` — no new view type is required. This keeps the user menu avatar highlighted (same visual state as the Settings page) and leaves all main nav tabs un-highlighted.
