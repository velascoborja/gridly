# Design Spec: Logout Confirmation Dialog

Add a confirmation dialog to the logout process to prevent accidental logouts.

## Context
Currently, clicking the logout button in `UserMenu` immediately triggers the `signOut` server action.

## Requirements
- Prompt the user with a dialog before logging out.
- Consistent visual style with the Gridly (Buddy) design (Stripe-inspired).
- Spanish language support.

## Proposed Changes

### 1. Localization (`messages/es.json` & `messages/en.json`)
Add new keys for the logout dialog.

**es.json:**
```json
"logout_confirm_title": "¿Cerrar sesión?",
"logout_confirm_description": "¿Estás seguro de que quieres salir? Tendrás que volver a identificarte para acceder a tus datos.",
"cancel": "Cancelar"
```

**en.json:**
```json
"logout_confirm_title": "Log out?",
"logout_confirm_description": "Are you sure you want to log out? You will need to sign in again to access your data.",
"cancel": "Cancel"
```

### 2. User Menu (`src/components/auth/user-menu.tsx`)
- Import `Dialog` components from `@/components/ui/dialog`.
- Wrap the logout button in a `DialogTrigger`.
- Move the logout `<form>` inside the `DialogContent`'s footer or equivalent.

## Architecture & Data Flow
1. User clicks "Cerrar sesión" button in the menu.
2. `Dialog` opens.
3. User clicks "Cancelar" -> `Dialog` closes.
4. User clicks "Cerrar sesión" (inside dialog) -> `<form>` submits to `signOut` action.

## Testing Strategy
- Manual verification: click logout, ensure dialog appears, click cancel, ensure still logged in, click confirm, ensure logged out and redirected.
