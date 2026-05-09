# Sensitive Text Encryption Design

## Goal

Protect Gridly against direct database browsing by making identity and free-text values unreadable in storage while keeping the current app behavior, calculations, charts, exports, and ownership checks intact.

## Status

Approved direction. Implementation has not started.

## Threat Model

Primary threat: someone with database console or dump access can inspect table contents but does not have the application runtime secrets.

This design does not claim protection against a full application server compromise. If an attacker obtains both the database and the runtime encryption/HMAC secrets, the application-level encrypted fields can be decrypted.

## Protected Data

Encrypt these reversible display/free-text fields:

- `users.email`
- `users.name`
- `users.image`
- `additional_entries.label`
- `year_recurring_expenses.label`
- `monthly_recurring_expenses.label`

Add a deterministic, non-reversible lookup value for email:

- `users.email_hash = HMAC(secret, normalizedEmail)`

`email_hash` supports authentication lookup and uniqueness without storing a readable email.

## Unchanged Data

Do not encrypt numeric financial columns in this pass:

- Year balances, salary estimates, monthly budgets, investment values, interest rates.
- Month income, expense, investment, interest, and remaining-budget fields.
- Additional and recurring expense amounts.
- Historical year financial summary values.

Keeping numeric values plaintext preserves Drizzle queries, calculations, carry-over propagation, sorting, charts, and Excel export behavior with minimal blast radius.

## Architecture

Add a small server-only crypto module for field protection:

- AES-256-GCM for reversible encryption.
- HMAC-SHA256 for deterministic email lookup.
- Versioned ciphertext format, for example `v1:<base64url-iv>:<base64url-tag>:<base64url-ciphertext>`.
- `normalizeEmail(email)` before hashing and encryption lookup, using trim plus lowercase.
- Fail closed when required secrets are missing in production.

Required runtime secrets:

- `GRIDLY_FIELD_ENCRYPTION_KEY`, 32 bytes encoded as base64.
- `GRIDLY_EMAIL_HASH_KEY`, high-entropy secret encoded as base64.

The two secrets must be distinct. OWASP guidance treats key management as part of the design, including key lifecycle, storage, rotation, and recovery planning:

- https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html
- https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html
- https://cheatsheetseries.owasp.org/cheatsheets/Key_Management_Cheat_Sheet.html

## Authentication Design

The stock Auth.js Drizzle adapter currently queries `users.email` directly. To hide email from database browsing without breaking sign-in, replace the stock adapter with a small wrapper/custom adapter that preserves the existing Drizzle adapter behavior except for user email operations:

- On `createUser`, store encrypted email in `users.email` and store `email_hash`.
- On `getUserByEmail`, compute `email_hash` from the normalized incoming email and query by `users.email_hash`.
- On any adapter method that returns a user row, decrypt `email`, `name`, and `image` before returning to Auth.js. This includes direct user reads, session joins, and account joins.
- On user updates, encrypt protected fields before writing.
- Keep `users.id` as the stable foreign-key ownership boundary.

The session callback can continue exposing `session.user.id`, `email`, `name`, `image`, and `language` to the UI after adapter-level decryption.

## Data Access Design

Keep plaintext values at the TypeScript boundary:

- API route handlers and server actions receive normal strings from requests.
- Before database writes, encrypt protected labels/profile fields.
- After database reads, decrypt protected labels/profile fields before mapping to existing app types.
- UI components do not know whether values are encrypted in storage.

Server-side read/write helpers should be added near the existing domain parsers:

- User/profile protection helpers for auth and settings.
- Additional entry parser/writer helpers.
- Recurring expense parser/writer helpers.

This keeps encryption logic out of React components and avoids duplicating crypto calls across routes.

## Schema And Migration

Add `users.email_hash` with a unique index. Keep existing string columns for encrypted payloads to reduce schema churn:

- `users.email` changes from plaintext email to encrypted email payload.
- `users.name` changes from plaintext name to encrypted name payload when present.
- `users.image` changes from plaintext image URL to encrypted image payload when present.
- `additional_entries.label` changes from plaintext label to encrypted label payload.
- `year_recurring_expenses.label` changes from plaintext label to encrypted label payload.
- `monthly_recurring_expenses.label` changes from plaintext label to encrypted label payload.

Migration strategy:

1. Add nullable `email_hash`.
2. Backfill hashes and encrypted values with a one-time server-side migration script using current plaintext values.
3. Add the unique constraint/index for `email_hash`.
4. Drop the existing unique constraint on `users.email`; encrypted email uses non-deterministic AES-GCM, so uniqueness belongs on `email_hash`.
5. Switch application code to encrypted read/write paths.
6. After verification, make `email_hash` non-null if Drizzle and the deployment migration path allow it cleanly.

During the transition, decrypt helpers should detect plaintext legacy values only in the migration window. After the migration is verified, plaintext fallback should be removed or guarded to prevent silently accepting new plaintext records.

## Legacy Owner Handling

`claimLegacyYearsForUser` currently compares the signed-in email to `LEGACY_OWNER_EMAIL`. Keep the comparison using the decrypted email supplied by Auth.js during sign-in, not by reading plaintext from the database.

`ensureLegacyOwner` should write encrypted user fields and `email_hash` if it remains needed.

## Key Rotation

Use ciphertext version prefixes from the first implementation. Rotation does not need to be fully automated in this pass, but the design should allow:

- New writes use the latest key version.
- Reads can decrypt old key versions during a rotation window.
- A future migration can re-encrypt existing values.

This matches OWASP's guidance that encryption key rotation can require gradual read/write rotation or partial data re-encryption.

## Error Handling

- Missing encryption secrets in production should throw at startup or first protected operation.
- Invalid ciphertext should not be returned to the UI as raw text.
- Auth lookup failures should behave like a normal missing user or failed sign-in, without leaking whether a hash exists.
- Migration scripts should fail fast and print counts, not decrypted values.
- OAuth token columns in `accounts` remain a residual risk unless they are minimized in a separate pass. Gridly does not currently call Google APIs after sign-in, so implementation should verify whether Auth.js can avoid persisting unused `access_token`, `refresh_token`, and `id_token` values without breaking sign-in.

## Testing

Add focused tests for:

- Encryption round trips and non-deterministic ciphertext for the same plaintext.
- HMAC email lookup determinism after normalization.
- No protected plaintext appears in database insert/update values.
- `getUserByEmail` finds users through `email_hash`.
- `getYearData` returns decrypted additional and recurring labels.
- Entry and recurring-expense APIs return decrypted labels after create/update.
- Existing calculation, carry-over, export, and i18n tests continue passing.

Verification commands:

```bash
npm test
npm run lint
npm run build
```

## Out Of Scope

- Encrypting numeric financial values.
- End-to-end encryption where only the user controls the key.
- Protection against full server compromise or leaked runtime secrets.
- Replacing Google sign-in.
- Encrypting session tokens, OAuth provider account IDs, OAuth access/refresh/id tokens, or Auth.js operational identifiers beyond the identity display fields listed above.
