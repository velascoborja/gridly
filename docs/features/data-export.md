# Feature: Data Export

This document describes the Excel export functionality.

## Overview

Users can export their entire year's data into a formatted Excel workbook or a single month into a Markdown template. This provides a portable backup and allows for custom offline analysis.

## Implementation

- **Library:** Uses `ExcelJS` to generate the annual `.xlsx` file and a Markdown builder for monthly exports.
- **Annual API:** `GET /api/years/[year]/export`.
- **Monthly API:** `GET /api/years/[year]/months/[month]/export`.
- **Localization:** The export logic respects the user's locale (Spanish or English) for sheet names and labels.

## Annual Workbook Structure

The generated workbook contains 13 sheets, or 14 if the year has any tagged or untagged additional spending:

- **Sheet 1 (year number, e.g. "2025"):** Annual summary containing:
    - KPI block: total saved (color-coded green/red), average savings, max savings, total invested, average additional expenses (red), average additional incomes (green).
    - Month-by-month breakdown table (starting balance, total income, total expenses, savings, ending balance).
    - Year configuration values.
- **Sheet 2 — "Categorías" / "Categories" (optional):** Tag analysis summary. Only present when the year has at least one additional or recurring expense entry. Contains a ranked table of tags (sorted by total spend descending, untagged last) with columns: tag name, total amount, and percentage share of total additional spending. Computed via `computeTagStats` — no extra DB queries.
- **Sheets 3–14 (localized month names):** One sheet per month with a horizontal two-column layout:
    - Left side (columns A–B): Expenses — fixed expenses subsection (home, personal budget, personal surplus as a negative expense, investment, recurring expenses), then additional expenses subsection, then total expenses.
    - Right side (columns D–E): Income — fixed income subsection (salary, extra pay, interests), then additional income subsection, then total income.
    - Month summary below both sections: starting balance, savings (color-coded green/red), ending balance.
- Formatting: Professional styling with Stripe-inspired colors and numeric formatting.

## Monthly Markdown Structure

The monthly export creates a `.md` file for the selected month. It follows the visible sections of the compact monthly template:

- **Expenses for next month:** home expense.
- **Fixed expenses:** personal budget, personal surplus as a negative expense, investment, and monthly recurring expense copies.
- **Current month expenses:** ungrouped additional expenses plus grouped expense entries labelled as `Group - Entry`.
- **Income:** fixed income rows (salary and interests) followed by a separate additional income table that includes extra pay and additional income entries.
- **Current summary:** starting balance, total income, total expenses, savings, and ending balance.

The Markdown is generated from server-side year data via `buildMonthlyMarkdown` and downloaded from the month header.

## Personal Surplus Totals

Both exports retain the editable gross personal budget and show surplus separately as a negative fixed-expense row. Income excludes surplus, and total expenses include its full subtraction, including legacy adjustments outside the valid range. Savings and balances remain unchanged.

## Additional Investments

The annual Total invested KPI includes programmed investments and ungrouped additional expenses marked `isInvestment`. Monthly Excel and Markdown expense descriptions append `[Additional investment]` (localized from the shared messages) to marked entries. Their amounts remain in the original additional-expense rows and appear only once in cash-flow totals. Categories and additional-expense averages continue to include them.
