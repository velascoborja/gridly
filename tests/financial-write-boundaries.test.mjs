import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';
import { generateDrizzleJson, generateMigration } from 'drizzle-kit/api';
import { loadFinancialModules, financialModulePaths } from './helpers/financial-modules.mjs';

const helperNames = new Set(['getOwnedYear', 'getOwnedMonth', 'getOwnedEntry', 'getOwnedGroup',
  'getOwnedRecurringExpense', 'getYearNumberForYearId', 'getYearData', 'getYearDataSnapshot',
  'getYearsForUser', 'propagateYearCarryOver', 'applyYearConfigToStoredMonths']);

test('every financial handler confines its dependent helpers to the transaction client', async () => {
  let operations = 0;
  for (const path of Object.values(financialModulePaths).filter((path) => path.includes('/api/') || path.includes('/actions/'))) {
    const source = await readFile(path, 'utf8');
    const ast = ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true);
    for (const fn of ast.statements.filter(ts.isFunctionDeclaration)) {
      if (!fn.body || !fn.getText(ast).includes('propagateYearCarryOver')) continue;
      const calls = [];
      function collect(node) {
        if (ts.isCallExpression(node)) calls.push(node);
        ts.forEachChild(node, collect);
      }
      collect(fn.body);
      const transaction = calls.find((node) => node.expression.getText(ast) === 'withFinancialTransaction');
      assert.ok(transaction, `${path}: ${fn.name.text} must use a transaction`);
      const callback = transaction.arguments[1];
      assert.equal(callback.parameters[0].name.getText(ast), 'db');
      for (const call of calls.filter((node) => helperNames.has(node.expression.getText(ast)))) {
        assert.ok(call.pos >= callback.pos && call.end <= callback.end, `${path}: helper escaped transaction`);
        assert.equal(call.arguments.at(-1)?.getText(ast), 'db', `${path}: helper must receive the same client`);
      }
      operations++;
    }
  }
  assert.equal(operations, 14);
});

test('integration harness loads the real route graph and generates its current schema', async () => {
  const harness = await loadFinancialModules(financialModulePaths);
  try {
    const { modules, state } = harness;
    // No database connection is opened when authentication fails.
    const response = await modules.years.POST(new Request('http://gridly.test', { method: 'POST' }));
    assert.equal(response.status, 401);
    assert.deepEqual(state.invalidations, []);
    const migration = await generateMigration(generateDrizzleJson({}), generateDrizzleJson(modules.schema));
    assert.ok(migration.some((sql) => sql.includes('CREATE TABLE "months"')));
    assert.ok(migration.some((sql) => sql.includes('ON DELETE cascade')));
  } finally { await harness.cleanup(); }
});
