# Gridly Design System

## 1. What Gridly Is

Gridly is a personal finance tool people open every week to record income and expenses and see where their money went. The amounts are the content. Everything else (cards, borders, labels, icons) is there to make those numbers easy to read and edit, and should stay out of the way.

The visual language borrows from Stripe: a purple accent, deep navy text, blue-tinted shadows, light display weights and tabular numbers. It is adapted to a dense product UI built with Next.js, Tailwind CSS v4, shadcn/ui on Base UI, and Geist.

**Where values live:** every color, radius, shadow and surface value is defined once in `src/app/globals.css`. This document says how to use them. If a value you need is missing, add a token there; don't inline it in a component.

## 2. Principles

1. **Numbers first.** On every screen the amounts carry the visual weight. Labels, chrome and decoration step back.
2. **Calm for repeat use.** A screen opened every week should feel quiet and predictable. Novelty wears thin fast; consistency doesn't.
3. **One accent.** Purple means "interactive", "selected" or "the main thing here". Positive and negative amounts use the financial tokens. No other accent competes.
4. **Extend before inventing.** Reuse the primitives in `src/components/ui/` and the patterns already on the same screen before creating a new component or style.
5. **Every element carries information.** If removing an element (an icon, a subtitle, a border, a badge) loses nothing, remove it.

## 3. Color & Tokens

### Semantic tokens

Use these through Tailwind classes (`bg-card`, `text-muted-foreground`, `border-border`, `bg-primary`, `ring-ring`).

| Token | Role |
|---|---|
| `background` / `foreground` | Page background and default text |
| `card` / `card-foreground` | Card and panel surfaces |
| `popover` / `popover-foreground` | Menus, popovers, dropdowns |
| `muted` / `muted-foreground` | Quiet fills (row hover, footers) and secondary text (labels, descriptions, metadata) |
| `secondary` / `secondary-foreground` | Secondary buttons and soft fills |
| `primary` / `primary-foreground` | Primary actions, selected state, links, the main chart series |
| `accent` / `accent-foreground` | Rare highlight fill; never a second brand color |
| `border` / `input` | Dividers, card borders, input borders |
| `ring` | Focus rings |
| `destructive` | Delete and irreversible actions, error text |
| `financial-positive` / `financial-negative` / `financial-neutral` | Amount coloring, via `.finance-number-positive`, `.finance-number-negative`, `.finance-number-neutral` |
| `chart-1` … `chart-5` | Chart series beyond the primary one |
| `surface-1` … `surface-3` | Translucent layered surfaces (used by `.surface-depth*`) |
| `elevation-1` … `elevation-3` | Shadow levels (used by `.surface-depth*`, and as `shadow-raised` / `shadow-floating`) |
| `warning` | Estimates and soft warnings (amber); never errors, which use `destructive` |
| `month-past` / `month-future` (+ `-foreground`) | Temporal context of a month: month rail chips and the leading edge of past/forecast entry cards |
| `hero-*` | The dark month hero only: `hero-foreground`, `hero-muted-foreground`, `hero-border`, `hero-control`, `hero-positive`, `hero-negative`, `hero-accent`, with `.surface-hero*` gradients and `shadow-hero*` |
| `overlay` | Backdrop behind dialogs and sheets, always with an opacity modifier |
| `decorative-ruby` / `decorative-magenta` | Marketing illustration only (see brand values below) |

Shadow tokens beyond the `Card` default: `shadow-featured` (the one hero surface), `shadow-sheet` (bottom sheets), `shadow-raised`, `shadow-floating`, `shadow-inset-accent` (2px primary leading edge). Page atmospheres live in `.app-atmosphere` (app shell, demo, loading) and `.landing-atmosphere` (public landing).

### Brand reference values

These values define the brand. Use them only when defining or adjusting tokens in `globals.css`, not as literals in components.

- Purple `#533afd`, purple hover `#4434d4`, soft purple border `#b9b9f9` / `#d6d9fc`
- Deep navy text `#061b31`, label slate `#273951`, body slate `#64748d`
- Border `#e5edf5`, soft surface `#f6f9fc`
- Ruby `#ea2261` and magenta `#f96bee`: decorative only (illustration, marketing), never for buttons, links or amounts

### Rules

- In components, use token classes. No hex literals (`text-[#061b31]`) and no raw Tailwind palette colors (`text-emerald-600`, `bg-rose-500`, `bg-sky-400`).
- Positive, negative and zero amounts use the `finance-number-*` classes, so the meaning of green and red is defined in one place.
- Tag colors come from `TAG_COLORS` in `src/lib/tags.ts`.
- A new color is a new token in `globals.css`, with a value for `:root` and one for `.dark`. The app ships light-only today, but the `.dark` tokens exist and should stay complete.
- Opacity modifiers on tokens (`border-primary/20`, `bg-muted/40`) are the way to get tints. Don't invent near-duplicate colors.

## 4. Typography

**Fonts:** Geist Sans for all UI text, Geist Mono for code and technical values (loaded in `src/app/layout.tsx`). `body` already enables the stylistic sets (`"ss01"`, `"cv02"`, `"cv03"`); don't re-declare them per component.

### Product scale

| Role | Classes | Notes |
|---|---|---|
| Page title | `text-3xl md:text-4xl font-light tracking-[-0.04em] text-foreground` | One per page |
| Section / card title | `text-base font-medium` (the `CardTitle` default) | Sentence case |
| Body | `text-sm` | Default UI text size |
| Label / metadata | `text-xs` or `text-sm`, `font-medium`, `text-muted-foreground` | Sentence case |
| KPI value | `text-3xl`–`text-5xl font-light finance-number` | The largest thing in its card |
| Table / list amount | `text-sm finance-number` | Right-aligned in columns |

### Rules

- **Weights:** 300 for display text and large amounts, 400 for body, 500 for labels, buttons and card titles. 600 sparingly, for a single emphasized number or word. No 700 or heavier.
- **Every amount uses `.finance-number`** (tabular, lining figures, slight negative tracking) so columns line up and digits don't shift while editing.
- **Tracking:** tighten only at display sizes (`tracking-[-0.04em]` on page titles and KPI values). Body and labels use normal tracking.
- **No eyebrow labels.** Don't put a small uppercase, letter-spaced label (`text-[11px] uppercase tracking-[0.18em]`) above headings or values. If a heading needs context, write a better heading or put a sentence-case description below it.
- Uppercase is only for literal abbreviations (EUR, IVA) and keyboard keys in `<kbd>`.

## 5. Layout & Density

- **Spacing rhythm:** 4px base, mostly 8px steps (`gap-2`, `gap-3`, `gap-4`, `gap-5`, `p-4`, `p-5`). Avoid arbitrary spacing values.
- **Cards** take their padding from the `Card` primitive: `py-5`, `px-5` on header and content, `gap-5` between parts; `size="sm"` for compact cards (`py-4`, `px-4`, `gap-4`). Don't override padding per instance without a reason.
- **Dense data, generous frame:** rows and lists are tight; the space around and between sections is generous. Don't pad individual rows like cards.
- **Numbers:** right-align numeric columns and amounts in rows; labels sit on the left. Keep the currency format consistent within a list.
- **Alignment:** data screens are left-aligned. Centered layouts are for empty states and auth screens only.
- **Mobile first:** everything must work at 375px wide with 16px side gutters and no horizontal page scroll. On mobile, secondary editing surfaces open as a `Sheet`; on desktop, as a `Dialog`.
- **Hierarchy:** one focal point per section. If two things look equally important, one of them isn't.

## 6. Surfaces, Radius & Elevation

### Radius

The scale comes from `--radius` (10px) in `globals.css`.

- `rounded-md`: inputs, buttons, small controls, list rows
- `rounded-lg`: cards, panels, dialogs
- `rounded-full`: status dots, avatars and chips only (`Badge` is already a chip)
- No arbitrary radii (`rounded-[6px]`, `rounded-[7px]`).

### Elevation

| Level | Use | How |
|---|---|---|
| Flat | Inline content, rows inside a card | No shadow |
| Card | Standard cards and panels | `shadow-sm` (the `Card` default) |
| Raised | Sticky headers, floating toolbars | `.surface-depth-raised` or `elevation-2` |
| Floating | Popovers, palettes, menus | `.surface-depth-floating` or `elevation-3` |
| Featured | The one hero surface on a screen | Blue-tinted shadow: `0 30px 45px -30px rgba(50,50,93,0.25), 0 18px 36px -18px rgba(0,0,0,0.1)` |

If a shadow you need isn't covered, add a token or utility to `globals.css` instead of a new one-off `shadow-[...]`.

### Gradients, tints & blur

- Page atmosphere (background washes) is set once by the app shell and `body`. Components don't add their own page-level background effects.
- Tinted or gradient panels are for deliberate emphasis: at most one or two per screen, brand hue only, and subtle (roughly 10% tint or less on light surfaces).
- Backdrop blur is for surfaces that float over content (sticky headers, dialogs, sheets), not for cards sitting on the page.
- Don't nest cards. Inside a card, separate groups with dividers (`divide-y`, `border-t`) or spacing, not another bordered box.

## 7. Components

Start from `src/components/ui/` (`button`, `card`, `badge`, `input`, `select`, `dialog`, `alert-dialog`, `sheet`, `dropdown-menu`, `separator`, `skeleton`). Extend a primitive with a variant before writing a parallel component.

- **Buttons:** use the `Button` variants. One `default` (primary) button per area; everything else is `outline`, `secondary` or `ghost`. `destructive` is a tinted button, and irreversible actions confirm through `AlertDialog`. Icon-only buttons need an accessible label.
- **Cards:** `CardHeader` with `CardTitle`, an optional `CardDescription` that adds information (not a restatement of the title), and an optional `CardAction`. Content first; a `CardFooter` only for actions or totals.
- **Inputs & selects:** the `Input` and `Select` primitives, labels in sentence case, amounts typed and shown with `finance-number`. Inline editing follows the existing `inline-edit-field` pattern.
- **Dialogs & sheets:** `Dialog` for focused desktop tasks, `Sheet` on mobile, `AlertDialog` for destructive confirmation. Title says what will happen; one primary action.
- **Badges & tags:** `Badge` for short status words; tags use `TAG_COLORS`. Don't use badges as decoration on headings.
- **Lists & tables:** rows hover with `bg-muted`, amounts right-aligned with `finance-number`, dividers between rows instead of per-row cards.
- **Charts (Recharts):** the main series uses `var(--color-primary)`, others `var(--color-chart-N)`; gridlines and axes in `border` / `muted-foreground`; tooltips show amounts with `formatCurrency` and `finance-number`. No 3D, no decorative gradient fills, no legend when there is one series.
- **Empty & loading states:** `Skeleton` shaped like the real content for loading. Empty states are one sentence plus one action.
- **Icons:** lucide-react at `size-4` (the default inside buttons). Icons accompany labels; they don't replace text the user needs to read.

## 8. Motion

- Animate state changes, not page loads: an entry being added (`animate-entry-highlight`), a month locking (`animate-lock-open` / `animate-lock-close`), a sheet opening, a value updating.
- Keep it short: 75–300ms, ease-out for entering, ease-in for leaving.
- Respect `motion-reduce` on anything beyond a color or opacity change.
- No staggered page-load reveals, parallax, or looping decorative animation inside the app.

## 9. UI Copy

- Every string goes through next-intl: Spanish in `messages/es.json` first, then `messages/en.json`. No hardcoded strings.
- Labels name the thing ("Gastos fijos", "Saldo final"). No marketing filler inside the app ("Descubre", "Potencia", "insights").
- Descriptions add information the title doesn't have; otherwise leave them out.
- Amounts are formatted with `formatCurrency` from `src/lib/utils.ts` (es-ES, euros by default).
- Sentence case everywhere, including buttons and headings.

## 10. Anti-Slop Checklist

Run this before calling any UI work done.

### Avoid

- Uppercase, letter-spaced eyebrow labels above headings or values
- Hex literals or raw Tailwind palette colors in components instead of tokens
- Arbitrary one-off values (`rounded-[7px]`, `text-[13px]`, `shadow-[...]`) when a scale step or token exists
- Card soup: wrapping every piece of content in its own bordered card, or cards inside cards
- Uniform grids of icon + title + blurb tiles inside the app
- More than one primary action per area, or a second accent color competing with purple
- Bold (700+) weights
- Centered layouts on data screens
- A new component when a primitive in `src/components/ui/` already covers the need
- Placeholder copy or fake data in shipped UI

`tests/design-tokens-source.test.mjs` enforces the checkable rules (hex, raw palette, bold, eyebrows, one-off shadows, `rgba()`) across `src/app` and `src/components`.

### Ask yourself

1. Does every color, radius and shadow come from a token or primitive?
2. Is there one focal point per section, and are the numbers the most prominent thing?
3. Does it work at 375px and on desktop, with no horizontal page scroll?
4. Are all strings in both `messages/es.json` and `messages/en.json`?
5. Did you check it in the browser preview, not just in the code?
6. Would removing any element lose information? If not, remove it.
