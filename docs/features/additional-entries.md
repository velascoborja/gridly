# Feature: Additional Entries

This document describes how variable income and expenses (Additional Entries) are managed.

## Overview

While `YearConfig` handles recurring fixed costs, `Additional Entries` allow users to track granular transactions throughout the month (e.g., a specific dinner, an unexpected gift, or a one-time repair).

## Data Structure

Each entry consists of:
- `label`: A description of the transaction.
- `amount`: The financial value (stored as numeric in DB).
- `type`: Either `income` or `expense`.

## UI & Implementation

- **Components:** `AdditionalEntriesCard` (src/components/monthly/additional-entries-card.tsx) manages the list and the creation of new entries.
- **API Endpoints:**
    - `POST /api/months/[monthId]/entries`: Create a new entry.
    - `DELETE /api/months/[monthId]/entries/[entryId]`: Remove an entry.
- **Integration:** The sum of all additional income and expenses is automatically factored into the `totalIncome` and `totalExpenses` calculations in `src/lib/calculations.ts`.
