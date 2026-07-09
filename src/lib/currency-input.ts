export function sanitizeNumericInput(value: string): string {
  return value.replace(/[^\d,.]/g, "");
}

export function sanitizeMoneyExpressionInput(value: string): string {
  return value.replace(/[^\d,.\-+*\/()\s€]/g, "").replace(/€/g, "");
}

export type MoneyExpressionErrorReason =
  | "empty"
  | "syntax"
  | "division-by-zero"
  | "non-finite"
  | "negative";

export type MoneyExpressionResult =
  | { ok: true; value: number; isExpression: boolean }
  | { ok: false; reason: MoneyExpressionErrorReason };

type Token =
  | { type: "number"; value: number }
  | { type: "operator"; value: "+" | "-" | "*" | "/" }
  | { type: "paren"; value: "(" | ")" };

class MoneyExpressionSyntaxError extends Error {}

class MoneyExpressionDivisionByZeroError extends Error {}

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

export function parseMoneyExpression(value: string): MoneyExpressionResult {
  const sanitized = sanitizeMoneyExpressionInput(value);
  const compact = sanitized.replace(/\s/g, "");

  if (!compact) return { ok: false, reason: "empty" };

  try {
    const tokens = tokenizeMoneyExpression(compact);
    if (tokens.length === 0) return { ok: false, reason: "empty" };

    const parser = new MoneyExpressionParser(tokens);
    const value = parser.parse();

    if (!Number.isFinite(value)) return { ok: false, reason: "non-finite" };
    if (value < 0) return { ok: false, reason: "negative" };

    return {
      ok: true,
      value,
      isExpression: /[+\-*/()]/.test(compact),
    };
  } catch (error) {
    if (error instanceof MoneyExpressionDivisionByZeroError) {
      return { ok: false, reason: "division-by-zero" };
    }

    if (error instanceof MoneyExpressionSyntaxError) {
      return { ok: false, reason: "syntax" };
    }

    return { ok: false, reason: "syntax" };
  }
}

function tokenizeMoneyExpression(value: string): Token[] {
  const tokens: Token[] = [];
  let index = 0;

  while (index < value.length) {
    const char = value[index];

    if (/\d/.test(char)) {
      let rawNumber = char;
      index += 1;

      while (index < value.length && /[\d,.]/.test(value[index])) {
        rawNumber += value[index];
        index += 1;
      }

      const parsed = parseLocalizedNumber(rawNumber);
      if (!Number.isFinite(parsed)) {
        throw new MoneyExpressionSyntaxError();
      }

      tokens.push({ type: "number", value: parsed });
      continue;
    }

    if (char === "+" || char === "-" || char === "*" || char === "/") {
      tokens.push({ type: "operator", value: char });
      index += 1;
      continue;
    }

    if (char === "(" || char === ")") {
      tokens.push({ type: "paren", value: char });
      index += 1;
      continue;
    }

    throw new MoneyExpressionSyntaxError();
  }

  return tokens;
}

class MoneyExpressionParser {
  private index = 0;
  private readonly tokens: Token[];

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  parse(): number {
    const value = this.parseExpression();

    if (!this.isAtEnd()) {
      throw new MoneyExpressionSyntaxError();
    }

    return value;
  }

  private parseExpression(): number {
    let value = this.parseTerm();

    while (this.matchOperator("+") || this.matchOperator("-")) {
      const operator = this.previous();
      const right = this.parseTerm();
      value = operator.value === "+" ? value + right : value - right;
    }

    return value;
  }

  private parseTerm(): number {
    let value = this.parseFactor();

    while (this.matchOperator("*") || this.matchOperator("/")) {
      const operator = this.previous();
      const right = this.parseFactor();

      if (operator.value === "*") {
        value *= right;
      } else {
        if (Math.abs(right) < Number.EPSILON) {
          throw new MoneyExpressionDivisionByZeroError();
        }
        value /= right;
      }
    }

    return value;
  }

  private parseFactor(): number {
    if (this.matchOperator("+")) return this.parseFactor();
    if (this.matchOperator("-")) return -this.parseFactor();

    if (this.matchParen("(")) {
      const value = this.parseExpression();
      if (!this.matchParen(")")) {
        throw new MoneyExpressionSyntaxError();
      }
      return value;
    }

    if (this.matchNumber()) {
      return this.previous().value as number;
    }

    throw new MoneyExpressionSyntaxError();
  }

  private matchNumber(): boolean {
    if (this.isAtEnd() || this.peek().type !== "number") return false;
    this.index += 1;
    return true;
  }

  private matchOperator(value: "+" | "-" | "*" | "/"): boolean {
    if (this.isAtEnd()) return false;
    const token = this.peek();
    if (token.type !== "operator" || token.value !== value) return false;
    this.index += 1;
    return true;
  }

  private matchParen(value: "(" | ")"): boolean {
    if (this.isAtEnd()) return false;
    const token = this.peek();
    if (token.type !== "paren" || token.value !== value) return false;
    this.index += 1;
    return true;
  }

  private previous(): Token {
    return this.tokens[this.index - 1];
  }

  private peek(): Token {
    return this.tokens[this.index];
  }

  private isAtEnd(): boolean {
    return this.index >= this.tokens.length;
  }
}
