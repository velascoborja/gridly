import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, locale = "es"): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatMonthName(
  month: number,
  locale = "es",
  format: "long" | "short" = "long",
): string {
  return new Intl.DateTimeFormat(locale, { month: format }).format(new Date(2024, month - 1, 1));
}
