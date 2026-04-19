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
  const returns = [];

  function visit(node) {
    if (ts.isReturnStatement(node) && node.expression) {
      returns.push(node);
    }
    ts.forEachChild(node, visit);
  }

  visit(functionBody);
  return returns.at(-1);
}

function findFirstCard(node) {
  let found = null;

  function visit(current) {
    if (found) return;

    if (ts.isJsxElement(current) && current.openingElement.tagName.getText() === "Card") {
      found = current;
      return;
    }

    ts.forEachChild(current, visit);
  }

  visit(node);
  return found;
}

function normalizeText(text) {
  return text.replace(/\s+/g, " ").trim();
}

function collectJsxText(node, sourceFile, texts) {
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

  if (ts.isJsxElement(node) || ts.isJsxFragment(node)) {
    for (const child of node.children) {
      collectJsxText(child, sourceFile, texts);
    }
    return;
  }

  if (ts.isJsxExpression(node) && node.expression) {
    collectJsxText(node.expression, sourceFile, texts);
    return;
  }

  ts.forEachChild(node, (child) => collectJsxText(child, sourceFile, texts));
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

  const headerCard = findFirstCard(mainReturn.expression);
  assert.ok(headerCard, "expected to find the header Card in the main return tree");

  const texts = [];
  collectJsxText(headerCard, sourceFile, texts);

  for (const label of ["Ahorro del mes", "Saldo final", "Saldo inicial", "Ingresos", "Gastos"]) {
    assert.ok(texts.includes(label), `expected header card to include ${label}`);
  }

  assert.ok(!texts.includes("Ahorro"), "old standalone Ahorro label should be removed from the header card");

  const savingsPosition = texts.indexOf("Ahorro del mes");
  const finalPosition = texts.indexOf("Saldo final");
  const initialPosition = texts.indexOf("Saldo inicial");

  assert.notEqual(savingsPosition, -1);
  assert.notEqual(finalPosition, -1);
  assert.notEqual(initialPosition, -1);
  assert.ok(savingsPosition < initialPosition, "Ahorro del mes should appear before Saldo inicial");
  assert.ok(finalPosition < initialPosition, "Saldo final should appear before Saldo inicial");
});
