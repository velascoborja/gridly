# Feature: Yearly Carry-over

This document describes how Gridly maintains financial continuity across different years.

## Overview

When a user manages multiple years (e.g., 2024 and 2025), changes in an earlier year should automatically reflect in the subsequent ones. If the user adds an expense in December 2024, the `startingBalance` for 2025 must be updated.

## Implementation Details

- **Logic:** `src/lib/server/year-carry-over.ts` handles the propagation.
- **Trigger:** Whenever monthly data, additional entries, recurring expenses, or a full-year prefill changes a year's totals, the system identifies if there are "downstream" years.
- **Calculation:** The `startingBalance` for a year is derived from the `endingBalance` of December of the previous year.
- **Persistence:** The system propagates the `startingBalance` field in the `years` table for all subsequent years belonging to the user.
- **Concurrency:** Each full year has an internal `carryOverVersion`. A downstream update is applied only when the predecessor still has the version used for the calculation. Conflicting propagations retry from fresh data, preventing an older browser request from overwriting a newer balance.
- **Creation repair:** When a later year is created, propagation starts from its latest predecessor after insertion. This also repairs a race where the predecessor changed while the new year was being created.

## Constraints

- Propagation only flows forward (past to future).
- The very first year created by a user serves as the anchor for the `startingBalance` unless manually adjusted in the settings of that specific year.
- Later-year starting balances are always derived server-side from the predecessor; the client-submitted value is not authoritative.
