import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import * as ts from "typescript";

async function readSource(path) {
  return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

function findMonthOverviewFunction(sourceFile) {
  return sourceFile.statements.find(
    (statement) =>
      ts.isFunctionDeclaration(statement) &&
      statement.name?.text === "MonthOverview" &&
      statement.body !== undefined,
  );
}

function findMainReturnStatement(functionBody) {
  for (let index = functionBody.statements.length - 1; index >= 0; index -= 1) {
    const statement = functionBody.statements[index];
    if (ts.isReturnStatement(statement) && statement.expression) {
      return statement;
    }
  }

  return undefined;
}

function unwrapExpression(expression) {
  let current = expression;

  while (ts.isParenthesizedExpression(current)) {
    current = current.expression;
  }

  return current;
}

function collectJsxTexts(node, sourceFile, texts) {
  if (ts.isJsxText(node)) {
    const text = normalizeText(node.getText(sourceFile));
    if (text) texts.push(text);
    return;
  }

  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
    const text = normalizeText(node.text);
    if (text) texts.push(text);
    return;
  }

  if (ts.isJsxExpression(node) && node.expression) {
    collectJsxTexts(node.expression, sourceFile, texts);
    return;
  }

  if (ts.isJsxElement(node) || ts.isJsxFragment(node)) {
    for (const child of node.children) {
      collectJsxTexts(child, sourceFile, texts);
    }
    return;
  }

  ts.forEachChild(node, (child) => collectJsxTexts(child, sourceFile, texts));
}

function normalizeText(text) {
  return text.replace(/\s+/g, " ").trim();
}

function getJsxElementName(node) {
  if (!ts.isJsxElement(node)) return null;
  return node.openingElement.tagName.getText();
}

function getDirectJsxChildNodes(node) {
  if (!ts.isJsxElement(node) && !ts.isJsxFragment(node)) return [];

  return node.children
    .map((child) => {
      if (ts.isJsxElement(child) || ts.isJsxFragment(child)) return child;
      if (ts.isJsxExpression(child) && child.expression) {
        const expression = unwrapExpression(child.expression);
        if (ts.isJsxElement(expression) || ts.isJsxFragment(expression)) return expression;
      }
      return null;
    })
    .filter(Boolean);
}

function hasLegacyPeerCluster(node, sourceFile) {
  let found = false;

  function visit(current) {
    if (found) return;

    if (ts.isJsxElement(current) || ts.isJsxFragment(current)) {
      const childBuckets = getDirectJsxChildNodes(current).map((child) => {
        const texts = [];
        collectJsxTexts(child, sourceFile, texts);
        return texts;
      });

      const containsSaldoInicial = childBuckets.some((texts) => texts.includes("Saldo inicial"));
      const containsSaldoFinal = childBuckets.some((texts) => texts.includes("Saldo final"));
      const containsStandaloneAhorro = childBuckets.some((texts) => texts.includes("Ahorro"));

      if (containsSaldoInicial && containsSaldoFinal && containsStandaloneAhorro) {
        found = true;
        return;
      }
    }

    ts.forEachChild(current, visit);
  }

  visit(node);
  return found;
}

test("month overview header source exposes the revised summary labels", async () => {
  const source = await readSource("src/components/monthly/month-overview.tsx");
  const sourceFile = ts.createSourceFile(
    "month-overview.tsx",
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );

  const monthOverview = findMonthOverviewFunction(sourceFile);
  assert.ok(monthOverview, "expected MonthOverview function to exist");

  const mainReturn = findMainReturnStatement(monthOverview.body);
  assert.ok(mainReturn?.expression, "expected MonthOverview to have a main return");

  const mainReturnExpression = unwrapExpression(mainReturn.expression);
  assert.ok(ts.isJsxElement(mainReturnExpression) || ts.isJsxFragment(mainReturnExpression), "expected a JSX return tree");

  const cardCandidates = [];
  function collectCards(node) {
    if (ts.isJsxElement(node) && getJsxElementName(node) === "Card") {
      cardCandidates.push(node);
    }
    ts.forEachChild(node, collectCards);
  }

  collectCards(mainReturnExpression);

  const headerCard = cardCandidates.find((card) => {
    const texts = [];
    collectJsxTexts(card, sourceFile, texts);
    return texts.includes("Inicial") && texts.includes("Saldo Final");
  });

  assert.ok(headerCard, "expected to find the summary Card in the main return tree");

  const texts = [];
  collectJsxTexts(headerCard, sourceFile, texts);

  for (const label of ["Ahorro Neto", "Saldo Final", "Inicial", "Ingresos", "Gastos"]) {
    assert.ok(texts.includes(label), `expected header card to include ${label}`);
  }

  assert.ok(!hasLegacyPeerCluster(headerCard, sourceFile), "old equal-weight KPI layout should be removed from the header card");

  const savingsPosition = texts.indexOf("Ahorro Neto");
  const finalPosition = texts.indexOf("Saldo Final");
  const initialPosition = texts.indexOf("Inicial");

  assert.notEqual(savingsPosition, -1);
  assert.notEqual(finalPosition, -1);
  assert.notEqual(initialPosition, -1);
  assert.ok(savingsPosition < initialPosition, "Ahorro Neto should appear before Inicial");
  assert.ok(finalPosition < initialPosition, "Saldo Final should appear before Inicial");
});
