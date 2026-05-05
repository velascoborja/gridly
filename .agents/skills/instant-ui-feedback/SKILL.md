---
name: instant-ui-feedback
description: Use when creating or modifying frontend pages, route navigation, links, buttons, forms, mutations, or async UI actions where a user could wait after tapping or clicking.
---

# Instant UI Feedback

## Core Rule

Every user-triggered interaction must either complete synchronously, render from already-mounted/cached state, or show an immediate pending/loading/optimistic state before any delay is observable.

Do not add a page, link, button, form, menu item, tab, or mutation without explicitly checking the user wait path.

## Interaction Inventory

Before editing UI behavior, list every new or touched interaction:

- Navigation: links, tabs, selectors, breadcrumbs, back/forward behavior, route changes.
- Actions: buttons, submits, deletes, saves, exports, language changes, sign out, menu items.
- Async work: `fetch`, server actions, router transitions, file generation, database mutations, suspense boundaries.

For each item, answer:

- What happens in the first 100 ms after click/tap?
- Can it reuse local state instead of unmounting and refetching?
- What does the user see while work is pending?
- Can the user double-submit or navigate into an inconsistent state?
- What happens on error?

## Navigation Rules

Prefer the fastest safe path in this order:

1. Keep related views in the same mounted client shell when they share data and are commonly navigated between.
2. Use framework route caching/prefetching/loading boundaries when a real route transition is necessary.
3. Fetch after navigation only when the destination cannot safely share current state.

When intercepting navigation:

- Keep a real `href` for accessibility, copy link, and no-JS fallback.
- Cancel framework navigation only when a local handler will render the destination immediately.
- Preserve browser history with `pushState`/router APIs and sync `popstate`/back-forward.
- Preserve route prefixes, locale segments, and dynamic params.
- Do not intercept modifier-key/open-in-new-tab behavior unless the framework navigation event already scopes it safely.

For Next.js App Router:

- Read the local `node_modules/next/dist/docs/` guide before changing routing APIs in projects that require it.
- Prefer `Link` plus `onNavigate` for cancelable client navigation; use `event.preventDefault()` only when rendering locally.
- Add `loading.tsx`/Suspense for routes that still need server/client loading.
- Avoid normal route transitions between sibling views if that unmounts the cache the user expects to keep.

## Button And Action Rules

Every async action must provide immediate feedback before awaiting:

- Set pending state synchronously before `await`.
- Disable the triggering control when duplicate execution is unsafe.
- Use `aria-busy`, `disabled`, clear pending text, spinner, skeleton, progress, or optimistic UI.
- Keep destructive actions guarded by confirmation and show pending while deletion is in progress.
- On success, update local UI immediately or navigate with an obvious transition.
- **Next.js Cache Invalidation:** Call `router.refresh()` after successful client-side mutations (`fetch`, `POST`, `PATCH`, `DELETE`) to invalidate the Client-Side Router Cache and prevent stale data when navigating back.
- On failure, clear pending state and show a visible, actionable error.

Never leave a user wondering whether a click registered. A console log is not user feedback.

## Implementation Patterns

Local shell navigation:

```tsx
<Link
  href={href}
  onNavigate={(event) => {
    event.preventDefault();
    window.history.pushState(null, "", href);
    setView("details");
  }}
>
  Details
</Link>
```

Async button with Next.js refresh:

```tsx
const router = useRouter();
const [isSaving, setIsSaving] = useState(false);

async function save() {
  setIsSaving(true);
  try {
    const res = await fetch("/api/update", { method: "PATCH", ... });
    if (res.ok) {
      updateLocalUI(await res.json());
      router.refresh(); // Keeps router cache in sync
    }
  } catch {
    setError("No se ha podido guardar.");
  } finally {
    setIsSaving(false);
  }
}

<Button onClick={save} disabled={isSaving} aria-busy={isSaving}>
  {isSaving ? "Guardando..." : "Guardar"}
</Button>
```

## Tests And Verification

Add or update tests for the interaction contract:

- Navigation that should be local must assert route navigation is prevented and local view state changes.
- Routes that must load must have a loading boundary or visible pending shell.
- Async buttons must assert pending/disabled/error states exist in source or runtime tests.
- Regression tests should fail before the fix and pass after it.

Before claiming completion, run the narrow interaction test and the project's lint/test command that covers the touched files. If full-suite failures are unrelated, report them separately.
