# Feature: Sensitive Text Encryption

## Overview

Gridly protects identity and free-text values from direct database browsing by storing those values as application-level encrypted ciphertext. The application decrypts them at server boundaries before returning existing TypeScript data shapes to UI components, calculations, and export builders.

## Threat Model

This feature protects against database console or dump access when the attacker does not also have the application runtime secrets. It does not protect against a full application server compromise where both the database and encryption secrets are exposed.

## Protected Fields

- `users.email`
- `users.name`
- `users.image`
- `additional_entries.label`
- `year_recurring_expenses.label`
- `monthly_recurring_expenses.label`

`users.email_hash` stores an HMAC-SHA256 of the normalized email so Auth.js can look up users and enforce email uniqueness without storing readable email addresses.

## Unchanged Fields

Numeric financial fields remain plaintext. This keeps month-chain calculations, carry-over propagation, charts, sorting, and Excel export behavior unchanged.

## Runtime Secrets

- `GRIDLY_FIELD_ENCRYPTION_KEY`: base64-encoded 32-byte AES-256-GCM key.
- `GRIDLY_EMAIL_HASH_KEY`: base64-encoded high-entropy HMAC key.
- `GRIDLY_ALLOW_PLAINTEXT_PROTECTED_FIELDS`: migration-window fallback flag. Keep this set to `0` after backfill.

Do not expose these values with a `NEXT_PUBLIC_` prefix.

## Migration

Existing plaintext rows are backfilled with:

```bash
npm run encrypt:backfill
```

The script prints row counts only and does not print decrypted emails, names, image URLs, or labels.
