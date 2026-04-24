# Feature: Data Export

This document describes the Excel export functionality.

## Overview

Users can export their entire year's data into a formatted Excel workbook. This provides a portable backup and allows for custom offline analysis.

## Implementation

- **Library:** Uses `ExcelJS` to generate the `.xlsx` file.
- **API:** `GET /api/years/[year]/export`.
- **Localization:** The export logic respects the user's locale (Spanish or English) for sheet names and labels.

## Workbook Structure

The generated workbook includes:
- A summary sheet with annual KPIs.
- 12 individual sheets (one per month) containing:
    - Fixed income and expenses.
    - Detailed lists of additional entries.
    - Monthly balances and savings.
- Formatting: Professional styling with Stripe-inspired colors and numeric formatting.
