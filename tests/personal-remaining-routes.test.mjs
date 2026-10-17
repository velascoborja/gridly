import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { Pool } from '@neondatabase/serverless';
import { getTableColumns } from 'drizzle-orm';
import { loadFinancialModules } from './helpers/financial-modules.mjs';

const harness = await loadFinancialModules({
  schema: 'src/db/schema.ts',
  month: 'src/app/api/months/[monthId]/route.ts',
  year: 'src/app/api/years/[year]/route.ts',
});
after(harness.cleanup);
harness.state.user = { id: 'user-1' };
const { schema, month, year } = harness.modules;

function connection(t, { remaining = 50, budget = 100, affected = [[6, '50'], [12, '150']] } = {}) {
  const previous = process.env.DATABASE_URL;
  process.env.DATABASE_URL = 'postgresql://unused:unused@localhost/unused';
  t.after(() => {
    if (previous === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = previous;
  });
  const events = [];
  const monthRow = { id: 1, yearId: 7, month: 6, personalExpense: String(budget), personalRemaining: String(remaining) };
  const yearRow = { id: 7, userId: 'user-1', year: 2026, monthlyPersonalBudget: String(budget) };
  const row = (table, values) => Object.keys(getTableColumns(table)).map((key) => values[key] ?? null);
  t.mock.method(Pool.prototype, 'connect', async () => ({
    query: async (query, parameters) => {
      const text = typeof query === 'string' ? query : query.text;
      events.push(text);
      if (text.includes('for update')) return { rows: [['user-1']] };
      if (text.includes('inner join "years"')) return { rows: [row(schema.months, monthRow)] };
      if (text.startsWith('select "month", "personal_remaining"')) {
        const from = parameters.at(-1);
        return { rows: affected.filter(([number]) => number >= from) };
      }
      if (text.includes('from "years" "years"') && !text.startsWith('select "year"')) {
        return { rows: [row(schema.years, yearRow)] };
      }
      if (text.startsWith('update "months"') && text.includes('returning')) return { rows: [row(schema.months, monthRow)] };
      if (text.startsWith('update "years"') && text.includes('returning')) return { rows: [row(schema.years, yearRow)] };
      return { rows: [] };
    },
    release() {},
  }));
  t.mock.method(Pool.prototype, 'end', async () => {});
  return events;
}
const request = (body) => new Request('http://localhost/api/test', {
  method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
});
const monthParams = { params: Promise.resolve({ monthId: '1' }) };
const yearParams = { params: Promise.resolve({ year: '2026' }) };

for (const body of [
  { personalRemaining: 101 }, { personalRemaining: -1 }, { personalRemaining: null },
  { personalExpense: 49 }, { personalExpense: 0, personalExpenseManualOverride: false },
]) {
  test(`monthly invalid edit/reset is rejected without writes: ${JSON.stringify(body)}`, async (t) => {
    const events = connection(t);
    const response = await month.PATCH(request(body), monthParams);
    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), { error: 'PERSONAL_REMAINING_OUT_OF_RANGE',
      code: 'PERSONAL_REMAINING_OUT_OF_RANGE', months: [6] });
    assert.equal(events.some((sql) => sql.startsWith('update ')), false);
  });
}

for (const [body, options] of [
  [{ personalRemaining: 100 }, {}], [{ personalRemaining: 0 }, { budget: 0, remaining: 0 }],
  [{ personalExpense: 200 }, { remaining: 150 }],
  [{ payslip: 2500 }, { remaining: 150 }],
  [{ personalRemaining: 0 }, { remaining: -10 }],
]) {
  test(`monthly valid edit preserves success contract and allows legacy correction/unrelated edits: ${JSON.stringify(body)} ${JSON.stringify(options)}`, async (t) => {
    const events = connection(t, options);
    const response = await month.PATCH(request(body), monthParams);
    assert.equal(response.status, 200);
    assert.equal((await response.json()).id, 1);
    assert.equal(events.filter((sql) => sql.startsWith('update "months"')).length, 1);
  });
}

test('annual conflicts reject the entire operation before year or month writes', async (t) => {
  const events = connection(t, { affected: [[1, '500'], [6, '110'], [12, '150']] });
  const response = await year.PATCH(request({ monthlyPersonalBudget: 100, applyFromMonth: 6 }), yearParams);
  assert.equal(response.status, 400);
  assert.deepEqual((await response.json()).months, [6, 12]);
  assert.equal(events.some((sql) => sql.startsWith('update ')), false);
});

test('annual reapplication validates the existing budget even when another setting changed', async (t) => {
  const events = connection(t);
  const response = await year.PATCH(request({ estimatedSalary: 2500 }), yearParams);
  assert.equal(response.status, 400);
  assert.deepEqual((await response.json()).months, [12]);
  assert.equal(events.some((sql) => sql.startsWith('update ')), false);
});

test('annual range excludes conflicts in earlier months and keeps the success contract', async (t) => {
  const events = connection(t, { affected: [[1, '500'], [6, '100'], [12, '0']] });
  const response = await year.PATCH(request({ monthlyPersonalBudget: 100, applyFromMonth: 6 }), yearParams);
  assert.equal(response.status, 200);
  assert.equal((await response.json()).id, 7);
  assert.equal(events.filter((sql) => sql.startsWith('update "years"')).length, 1);
  assert.equal(events.filter((sql) => sql.startsWith('update "months"')).length, 1);
});
