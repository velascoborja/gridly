# Feature: Atomic Financial Writes

## Transaction boundary

`src/db/financial-transaction.ts` provides `withFinancialTransaction(userId, operation)`. Financial writes use a request-scoped Neon WebSocket connection with Drizzle's `neon-serverless` driver. Ordinary reads and authentication storage keep the existing HTTP client. No database schema migration is required.

The helper starts a `READ COMMITTED` transaction and locks the authenticated user's `users` row with `SELECT ... FOR UPDATE` before mutation-dependent ownership checks or financial reads. Every financial writer takes this same lock, so two requests for one account serialize, including when no year exists yet. Different accounts use different locks. Legacy year assignment also participates in the lock because it changes chain membership.

The callback receives the transaction client. Ownership helpers, year lists, year snapshots, baseline updates, and `propagateYearCarryOver` must receive that same client. A new financial mutation must not read or write through the global HTTP `db` inside the callback. The carry-over helper requires an explicit transaction; general read helpers retain an optional executor for their ordinary HTTP callers.

The complete mutation and all downstream balances commit together. Any thrown error rolls back inserts, updates, deletes, foreign-key cascades, template-link nullification, and carry-over version changes. PostgreSQL sequences can still advance after an aborted insert; gaps in IDs are expected. Validation responses are returned before writes; errors after writes must throw. Success responses are returned and route caches invalidated only after commit.

The helper explicitly owns and releases its client, including failures during connection setup, `BEGIN`, or rollback. Connections are destroyed at the end of each request. Pool cleanup errors are logged without connection details and do not override a successful commit or the original transaction error.

## Covered operations

- Guided year creation: configuration, templates, twelve months, monthly recurring copies, recurring additional entries from the previous year, and carry-over.
- REST year creation: configuration, templates, and carry-over. The existing two-step API is preserved: a separate prefill request creates the months. Atomicity applies to each request, not across the two HTTP requests.
- Year configuration changes: annual fields, selected monthly baselines, and downstream balances.
- Year deletion: cascaded records and subsequent carry-over repair.
- Prefill: deletion of existing months and their dependent records, recreation, recurring copies, and downstream balances.
- Annual recurring replacement: templates, selected monthly copies, and downstream balances. Earlier monthly values remain unchanged; their old template references become null as before.
- Monthly fixed fields, additional entries, group movement/deletion, and monthly recurring changes, including associated group-child and series-tag writes.

Metadata-only changes retain the existing propagation suppression. They still use the transaction in mixed financial handlers so their state checks and multi-row writes cannot race with financial operations.

## Concurrency and failure behavior

The existing versioned carry-over engine and its five conflict attempts remain as defensive checks. Its reads and version updates now run inside the user transaction. Missing source years or required snapshots throw instead of silently accepting an incomplete chain. No-downstream operations still skip snapshots/version updates, and the final destination need not have months yet.

An HTTP/network failure after the database commits can leave the client uncertain whether the operation succeeded. Atomicity prevents a partially committed operation; it does not provide exactly-once request delivery. The transaction helper does not automatically retry writes after network errors. All participating writers must be released together; older code or direct SQL that bypasses this lock does not receive its concurrency guarantees.

This change prevents new partially persisted operations. It does not automatically repair previously damaged data.

## Verification

Run `npm test`, `npm run lint`, and `npx tsc --noEmit` for local regression checks. Runtime tests exercise lock/commit/rollback order, connection cleanup, and absence of automatic retries; boundary tests verify that all fourteen financial entrypoints pass the transaction to dependent helpers. Existing CAS and domain tests remain in place.

For real PostgreSQL rollback and concurrency checks:

1. Provision a disposable Neon branch or database separate from the application database.
2. Set `TEST_DATABASE_URL` in the ignored `.env` file (or environment). The integration runner loads `.env` and never falls back to `DATABASE_URL`.
3. Run `npm run test:integration`.

The runner rejects a missing test connection or one identifying the application database. It creates a uniquely named schema, generates its tables from the current Drizzle schema, scopes every test connection to that schema, and drops only that schema during cleanup. The test role needs schema creation/deletion privileges. A process killed before cleanup can leave an `atomic_<uuid>` schema in the disposable database.

The integration suite executes production handlers and calculations with stubbed session/cache boundaries. It injects failures after SQL writes and checks complete row snapshots, including cascaded rows, relationships, tags, balances, and versions. It also coordinates concurrent requests with query barriers, checks successful creation retries, `applyFromMonth`, metadata-only saves, recurring-entry copying, and the two-step REST creation contract. Integration success is required to validate the database guarantees; local source or mocked-driver tests alone are not sufficient.
