# Feature: Data Export

This document describes the Excel export functionality.

## Overview

Users can export their entire year's data into a formatted Excel workbook. This provides a portable backup and allows for custom offline analysis.

## Implementation

- **Library:** Uses `ExcelJS` to generate the `.xlsx` file.
- **API:** `GET /api/years/[year]/export`.
- **Localization:** The export logic respects the user's locale (Spanish or English) for sheet names and labels.

## Workbook Structure

The generated workbook contains 13 sheets:

- **Sheet 1 (year number, e.g. "2025"):** Annual summary containing:
    - KPI block: total saved (color-coded green/red), average savings, max savings, total invested, average additional expenses (red), average additional incomes (green).
    - Month-by-month breakdown table (starting balance, total income, total expenses, savings, ending balance).
    - Year configuration values.
- **Sheets 2–13 (localized month names):** One sheet per month with a horizontal two-column layout:
    - Left side (columns A–B): Expenses — fixed expenses subsection (home, personal, investment, recurring expenses), then additional expenses subsection, then total expenses.
    - Right side (columns D–E): Income — fixed income subsection (salary, extra pay, interests, personal surplus), then additional income subsection, then total income.
    - Month summary below both sections: starting balance, savings (color-coded green/red), ending balance.
- Formatting: Professional styling with Stripe-inspired colors and numeric formatting.
