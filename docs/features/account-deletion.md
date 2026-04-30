# Feature: Account Deletion

## Overview

Signed-in users can permanently delete their Gridly account from the Settings danger zone. The flow is intentionally guarded because it removes the user record and all related finance data.

## Key Components

- `src/components/settings/settings-form.tsx`: renders the danger zone and owns the delete confirmation state.
- `src/app/api/user/settings/route.ts`: exposes `DELETE /api/user/settings`, validates the active session, and deletes the authenticated user row.
- `messages/es.json` and `messages/en.json`: contain all user-facing confirmation, pending, and error copy.

## Implementation Details

Account deletion uses a two-step `AlertDialog` flow:

1. The first step explains the permanent data loss and asks the user to continue.
2. The second step requires typing the localized confirmation phrase before the destructive action is enabled.

The final delete button sets `isDeleting` before calling the API, disables duplicate submissions, exposes `aria-busy`, and shows localized pending text. On success, the browser navigates to the localized landing page with `accountDeleted=1`. On failure, the dialog remains usable and a localized error is shown in the danger zone.
