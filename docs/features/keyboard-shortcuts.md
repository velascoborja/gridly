# Keyboard Shortcuts

Gridly supports keyboard shortcuts for fast navigation and common actions. All shortcuts use `Cmd` (macOS) or `Ctrl` (Windows/Linux).

Shortcuts are suppressed when focus is inside any input, textarea, or select element.

## Global (all pages)

| Shortcut | Action |
|---|---|
| `Cmd+1` | Navigate to Meses (month view) |
| `Cmd+2` | Navigate to Años (annual summary) |
| `Cmd+3` | Navigate to Evolución |

Tab shortcuts (`Cmd+1/2/3`) respect disabled state: if a historical year is selected, `Cmd+1` and `Cmd+2` are no-ops.

## In-year navigation (Meses, Años, and Ajustes)

| Shortcut | Action |
|---|---|
| `Cmd+K` | Open entry search |
| `Cmd+Shift+K` | Open direct month navigation |
| `Cmd+B` | Jump to current calendar month |

The direct month palette initially displays all 12 localized month names. Typing filters by a case- and diacritic-insensitive prefix, so `ene` or `sep` selects the matching Spanish month while `jan` works in English. Arrow keys move the active result and `Enter` opens it through the existing local month selector.

The entry and month palettes are mutually exclusive. `Cmd+B` only fires when the active year matches the current calendar year.

## Month navigation (Meses view)

| Shortcut | Action |
|---|---|
| `Cmd+Shift+←` | Previous month |
| `Cmd+Shift+→` | Next month |

## Entries & groups (Meses view)

| Shortcut | Action |
|---|---|
| `Cmd+Shift+E` | Open add expense form |
| `Cmd+Shift+I` | Open add income form |
| `Cmd+Shift+G` | Open create expense group form |
| `Cmd+Shift+.` | Expand / collapse all expense groups |
| `Cmd+.` | Toggle expand/collapse fixed values |

Entry and group shortcuts are no-ops in read-only mode.

`Cmd+Shift+.` expands all groups when any group is collapsed; collapses all when every group is already expanded. It is a no-op when the current month has no expense groups.

## Settings reference card

The Settings page (`/settings`) displays a read-only reference card listing all shortcuts grouped by context. It lives in `src/components/settings/shortcuts-card.tsx` and detects the user's OS from `navigator.userAgent` through a hydration-safe client snapshot to display `⌘` (macOS) or `Ctrl` (Windows/Linux). All strings are under the `KeyboardShortcuts` i18n namespace.

## Implementation

Shortcuts are split across two components:

- **`src/components/layout/nav-selectors.tsx`** — `Cmd+1/2/3` tab navigation. Lives here so it works on every page, including `/evolution` which has no year-page client.
- **`src/components/year/year-page-client.tsx`** — all remaining shortcuts. Uses `useRef` callbacks registered by child components (`MonthOverview`, `AdditionalEntriesCard`) to trigger imperative actions like opening forms or toggling panels.
- **`src/components/search/month-navigation-palette.tsx`** — localized month command palette. It reuses `handleMonthSelect`, so opening a result changes mounted state and calls `window.history.pushState()` without refetching `YearData`.

`Cmd+Shift+.` uses `toggleAllGroupsRef`, which is wired through `MonthOverview` → `AdditionalEntriesCard`. The card owns the collapsed state for all groups (lifted from `AdditionalEntryGroupRow`) and registers the handler that reads current state and sets all groups expanded or collapsed atomically.
