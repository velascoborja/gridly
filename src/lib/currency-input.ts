export function sanitizeNumericInput(value: string): string {
  return value.replace(/[^\d,.]/g, "");
}

export function parseLocalizedNumber(value: string): number {
  const cleaned = value
    .replace(/[^\d,.-]/g, "")
    .replace(/(?!^)-/g, "");

  if (!cleaned || cleaned === "-") return 0;

  const lastComma = cleaned.lastIndexOf(",");
  const lastDot = cleaned.lastIndexOf(".");
  const decimalSeparator = lastComma > lastDot ? "," : lastDot > -1 ? "." : "";

  if (!decimalSeparator) {
    const parsed = Number(cleaned);
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  const separatorIndex = cleaned.lastIndexOf(decimalSeparator);
  const fractionalPart = cleaned.slice(separatorIndex + 1);
  const hasOnlyOneSeparator = cleaned.indexOf(decimalSeparator) === separatorIndex;
  const shouldTreatAsGrouping = hasOnlyOneSeparator && fractionalPart.length === 3;

  if (shouldTreatAsGrouping) {
    const parsed = Number(cleaned.replace(/[.,]/g, ""));
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  const integerPart = cleaned.slice(0, separatorIndex).replace(/[.,]/g, "");
  const normalized = `${integerPart}.${fractionalPart.replace(/[.,]/g, "")}`;
  const parsed = Number(normalized);

  return Number.isNaN(parsed) ? 0 : parsed;
}
