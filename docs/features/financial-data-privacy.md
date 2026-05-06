# Feature: Financial Data Privacy

Gridly supports optional application-layer encryption for stored financial data. This protects the user's plan values and transaction labels from direct database inspection while preserving the app's existing runtime behavior.

## Overview

The privacy boundary is implemented server-side in `src/lib/server/financial-data-privacy.ts`.

- If `FINANCIAL_DATA_ENCRYPTION_KEY` is not configured, financial values are stored as plaintext. This keeps local development and existing deployments compatible.
- If `FINANCIAL_DATA_ENCRYPTION_KEY` is configured, new financial writes are stored as AES-256-GCM payloads with the `enc:v1:` prefix.
- Reads are backward-compatible: plaintext values are parsed directly, and encrypted values are decrypted before being returned to components or calculations.
- Existing plaintext rows remain usable. They become protected when they are rewritten through the normal app flows.

The authentication tables and identity fields (`users`, `accounts`, `sessions`, OAuth metadata) are intentionally unchanged so sign-in and account linking behavior remain stable.

## Protected Fields

The following data is protected when the encryption key is enabled:

- Year configuration amounts and rates in `years`.
- Monthly income, expense, investment, interest, and remaining-budget values in `months`.
- Additional entry labels and amounts in `additional_entries`.
- Year recurring expense labels and amounts in `year_recurring_expenses`.
- Monthly recurring expense labels and amounts in `monthly_recurring_expenses`.

Database amount columns use `text` so they can store either legacy numeric text or encrypted payloads. Server code converts them back to `number` immediately after reading.

## Configuration

Set `FINANCIAL_DATA_ENCRYPTION_KEY` in the runtime environment to enable encryption for new writes.

Recommended format:

```bash
FINANCIAL_DATA_ENCRYPTION_KEY=base64:<32-byte-base64-value>
```

Generate a key with:

```bash
openssl rand -base64 32
```

The helper also accepts `hex:<32-byte-hex-value>` and arbitrary strings. Arbitrary strings are hashed to a 32-byte AES key, but generated base64 or hex keys are preferred.

If encrypted rows exist and the key is missing or changed, the app fails when reading those rows because the financial data cannot be decrypted.

## Implementation Details

- `protectFinancialText` and `protectFinancialNumber` are used on server write paths.
- `revealFinancialText` and `parseProtectedFinancialNumber` are used on server read and response serialization paths.
- `getYearData` decrypts data before building `YearData`, so calculations and client components continue to work with plain `number` and label values.
- API route responses serialize decrypted values back to the client and never intentionally expose encrypted payloads.
- `drizzle/0003_protect_financial_data.sql` changes sensitive numeric columns to `text` without rewriting existing values.

## Limitations

This is encryption at rest, not a zero-knowledge model. The running server can decrypt data because it has the key. Direct database inspection no longer reveals protected financial values, but someone with both database access and the runtime encryption key can still decrypt them.

Key rotation and automatic backfill encryption of existing rows are not implemented. Existing plaintext data is protected gradually as users edit or recreate financial records.
