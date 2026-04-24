# Feature: Yearly Carry-over

This document describes how Gridly maintains financial continuity across different years.

## Overview

When a user manages multiple years (e.g., 2024 and 2025), changes in an earlier year should automatically reflect in the subsequent ones. If the user adds an expense in December 2024, the `startingBalance` for 2025 must be updated.

## Implementation Details

- **Logic:** `src/lib/server/year-carry-over.ts` handles the propagation.
- **Trigger:** Whenever a month's data is updated or an additional entry is modified, the system identifies if there are "downstream" years.
- **Calculation:** The `startingBalance` for a year is derived from the `endingBalance` of December of the previous year.
- **Persistence:** The system performs an asynchronous propagation to update the `startingBalance` field in the `years` table for all subsequent years belonging to the user.

## Constraints

- Propagation only flows forward (past to future).
- The very first year created by a user serves as the anchor for the `startingBalance` unless manually adjusted in the settings of that specific year.
