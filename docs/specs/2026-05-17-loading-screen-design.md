# Loading Screen Redesign

**Date:** 2026-05-17
**Status:** Approved

## Goal

Replace the current "Preparando Gridly" loading screen (floating card + Loader2 spinner) with a confident, minimal full-screen layout that centres the brand without a container card.

## Design Direction

**Minimal Centered** — no card, wordmark as the sole focal point, a shimmer progress bar below it, and a softly fading text label. Background carries a very subtle dual-radial gradient to add warmth without distraction.

## Visual Specification

### Background

```
radial-gradient(ellipse at 30% 20%, rgba(83,58,253,0.07) 0%, transparent 55%),
radial-gradient(ellipse at 75% 15%, rgba(20,184,166,0.05) 0%, transparent 48%),
#ffffff
```

Static (not animated). Soft purple aura top-left, soft teal aura top-right, white base.

### Layout

`main` fills `min-h-dvh`, uses CSS Grid `place-items-center`. No card, no border, no shadow container. Single centered column.

### Wordmark

- Existing `/gridly-wordmark.svg` via `next/image`
- `height: 40px` (`h-10`), `width: auto`
- `mb-6` (24px gap between wordmark and progress bar)
- `priority` prop retained

### Progress Bar

| Property | Value |
|---|---|
| Width | 88px |
| Height | 2px |
| Border-radius | 2px |
| Track background | `rgba(83,58,253,0.12)` |
| Fill gradient | `transparent 0% → #533afd 40% → #665efd 70% → transparent 100%` |
| Fill width | 60% of track |
| Animation | `shimmerSlide` — `translateX(-150%) → translateX(280%)` |
| Duration | 1.7s |
| Easing | `cubic-bezier(0.4, 0, 0.6, 1)` |
| Iteration | infinite |

The fill uses a transparent-to-purple-to-transparent gradient so it reads as a sweeping light rather than a filling bar, avoiding false progress expectation.

### Text Label

- Content: `"Preparando Gridly..."`
- Font size: `11px` (`text-[0.6875rem]`)
- Color: `rgba(100,116,141,0.8)` (muted-foreground at reduced opacity)
- `mt-3` (12px gap below progress bar)
- Animation: `labelFade` — `opacity: 0, translateY(3px)` → `opacity: 1, translateY(0)` → `opacity: 0, translateY(3px)`
- Duration: 2.6s, ease-in-out, infinite
- The subtle Y-translation gives a gentle floating-into-place feel

### Accessibility

Preserved from the current implementation:
- `<main>` wraps the layout
- `aria-busy="true"` and `aria-live="polite"` on the content section
- `role="status"` on the animated element
- `<span className="sr-only">` with the label text for screen readers

## File Changed

`src/app/[locale]/loading.tsx` — full replacement of component body.

## What Is Removed

- The `<section>` card container (border, background, shadow, backdrop-blur)
- The `Loader2` spinning icon from lucide-react
- The `border-border/70` and `bg-background/90` surfaces

## Animations

The project uses Tailwind CSS v4 with no `tailwind.config` file. Keyframes and animation tokens live in `globals.css`.

Add to `globals.css`:

```css
@keyframes shimmer-slide {
  0%   { transform: translateX(-150%); }
  100% { transform: translateX(280%); }
}

@keyframes label-fade {
  0%, 100% { opacity: 0; transform: translateY(3px); }
  25%, 75%  { opacity: 1; transform: translateY(0); }
}
```

Add inside the existing `@theme inline` block:

```css
--animate-shimmer-slide: shimmer-slide 1.7s cubic-bezier(0.4,0,0.6,1) infinite;
--animate-label-fade: label-fade 2.6s ease-in-out infinite;
```

This exposes `animate-shimmer-slide` and `animate-label-fade` as Tailwind utility classes.
