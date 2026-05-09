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

- **Components:** `AdditionalEntriesCard` (src/components/monthly/additional-entries-card.tsx) manages the list, creation, editing, deletion, and move affordances for additional entries.
- **Amount inputs:** Creation and edit forms keep numeric text in component state, show an in-input Euro suffix as soon as the amount field is editable, and sanitize typed or pasted text through `sanitizeNumericInput`, keeping only digits plus `,` and `.` decimal separators before parsing the amount sent to the API.
- **API Endpoints:**
    - `POST /api/months/[monthId]/entries`: Create a new entry.
    - `PATCH /api/months/[monthId]/entries/[entryId]`: Edit an entry label/amount or move it to another month by sending `monthId`.
    - `DELETE /api/months/[monthId]/entries/[entryId]`: Remove an entry.
- **Moving Entries:** In editable monthly views, additional income and expense rows can be dragged onto another month in the month strip. Moving changes the entry's owning month only; it does not copy or duplicate the entry. Moves are restricted to months in the same year.
- **Integration:** The sum of all additional income and expenses is automatically factored into the `totalIncome` and `totalExpenses` calculations in `src/lib/calculations.ts`.

## Year Summary View

The year summary page displays average additional entries alongside the Balance and Savings charts:
- **Average Additional Expenses per Month:** Total of all additional expenses across all 12 months, divided by 12.
- **Average Additional Income per Month:** Total of all additional incomes across all 12 months, divided by 12.

These statistics appear as two stat cards on the year summary page, providing a quick view of typical monthly variable transactions.

**Relevant Code:**
- `avgAdditionalEntriesPerMonth()` in `src/lib/additional-entries.ts`: Calculates the yearly average for a given entry type.
- `AdditionalEntriesAverages` component in `src/components/annual/additional-entries-averages.tsx`: Renders the stat cards with currency formatting and icon indicators (red for expenses, green for income).
