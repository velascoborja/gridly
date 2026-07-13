# Feature: Application Security

## Overview

Gridly applies defense-in-depth controls to authentication records stored in PostgreSQL and to every HTTP response served by Next.js. These controls reduce the value of a database read compromise and constrain browser behavior if untrusted content reaches a page.

## Key Components

- `src/lib/server/encryption.ts`: AES-256-GCM helpers. Lookup fields use deterministic encryption; non-queryable secrets use randomized IVs.
- `src/lib/server/encrypted-adapter.ts`: Auth.js adapter wrapper that encrypts user profile fields, OAuth tokens, and database session tokens before storage and decrypts them at the adapter boundary.
- `next.config.ts`: Global Content Security Policy and related response headers, plus removal of the `X-Powered-By` header.
- `src/lib/server/encryption.test.ts`, `src/lib/server/encrypted-adapter.test.ts`, and `next.config.test.ts`: Executable regression coverage for encryption round trips, encrypted storage and lookup behavior, legacy session compatibility, and response-header configuration.

## Implementation Details

`ENCRYPTION_KEY` must be a base64-encoded 32-byte key. User email, name, image, and session tokens use deterministic AES-256-GCM ciphertext because Auth.js must look them up by their plaintext values. OAuth `refresh_token`, `access_token`, `id_token`, and string `session_state` values use a fresh random IV for every write because they are not lookup keys. Adapter consumers only receive plaintext values.

The adapter attempts an encrypted session-token lookup first and then a plaintext lookup. This keeps sessions created before session-token encryption valid until they expire. All newly created sessions and linked OAuth accounts are stored encrypted. Existing provider-token rows should be rotated or relinked during deployment so old plaintext provider tokens are removed from the database.

Every route receives a Content Security Policy that limits content to Gridly's own origin, permits the configured Google profile-image host, blocks plugins and framing, and constrains base URLs and form submissions. Production responses also request upgrades for insecure subresources. `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, and `Permissions-Policy` provide compatibility and additional browser restrictions. HSTS remains a deployment-layer responsibility so local HTTP development is not affected.
