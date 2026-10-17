import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { Pool } from '@neondatabase/serverless';
import { getTableColumns } from 'drizzle-orm';
import { loadFinancialModules } from './helpers/financial-modules.mjs';

const harness = await loadFinancialModules({
  schema: 'src/db/schema.ts',
  entries: 'src/app/api/months/[monthId]/entries/route.ts',
  entry: 'src/app/api/months/[monthId]/entries/[entryId]/route.ts',
  transaction: 'src/db/financial-transaction.ts',
  yearData: 'src/lib/server/year-data.ts',
});
after(harness.cleanup);
const { schema, entries, entry, transaction, yearData } = harness.modules;

// Execute the production routes, Drizzle queries and hydration against a scoped
// connection stub. No application database is contacted.
function connection(t, overrides = {}) {
  const previous = process.env.DATABASE_URL;
  process.env.DATABASE_URL = 'postgresql://unused:unused@localhost/unused';
  harness.state.user = { id: 'user-1' };
  t.after(() => {
    if (previous === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = previous;
  });
  const events = [];
  let stored = { id: 1, monthId: 1, groupId: null, type: 'expense', label: 'ETF', amount: '200.00',
    isRecurring: false, isInvestment: false, isCompleted: false, tagId: null, ...overrides };
  const monthRow = (id) => ({ id, yearId: 7, month: id, homeExpense: '0', personalExpense: '0',
    investment: '300', payslip: '2000', additionalPayslip: '0', interests: '0',
    interestsManualOverride: false, personalRemaining: '0' });
  const group = { id: 10, monthId: 1, label: 'Group', isCompleted: false, tagId: null };
  const yearRow = { id: 7, userId: 'user-1', year: 2026, startingBalance: '1000', estimatedSalary: '2000',
    hasExtraPayments: false, estimatedExtraPayment: '0', monthlyInvestment: '300', monthlyHomeExpense: '0',
    monthlyPersonalBudget: '0', interestRate: '0', carryOverVersion: 0 };
  const row = (table, values) => Object.keys(getTableColumns(table)).map((key) => values[key] ?? null);
  const entryColumns = getTableColumns(schema.additionalEntries);
  const entryKey = (name) => Object.keys(entryColumns).find((key) => entryColumns[key].name === name);
  t.mock.method(Pool.prototype, 'connect', async () => ({
    query: async (query, parameters = []) => {
      const sql = typeof query === 'string' ? query : query.text;
      events.push(sql);
      if (sql.includes('for update')) return { rows: [['user-1']] };
      if (sql.startsWith('insert into "additional_entries"')) {
        const [, columns, values] = sql.match(/\((.*?)\) values \((.*?)\) returning/);
        stored = { ...stored, isInvestment: false };
        columns.split(', ').forEach((column, index) => {
          const parameter = values.split(', ')[index].match(/\$(\d+)/);
          if (parameter) stored[entryKey(column.replaceAll('"', ''))] = parameters[Number(parameter[1]) - 1];
        });
        return { rows: [row(schema.additionalEntries, stored)] };
      }
      if (sql.startsWith('update "additional_entries"')) {
        const assignments = sql.split(' where ')[0];
        for (const [, name, index] of assignments.matchAll(/"(\w+)" = \$(\d+)/g)) {
          stored[entryKey(name)] = parameters[Number(index) - 1];
        }
        return { rows: [row(schema.additionalEntries, stored)] };
      }
      if (sql.includes('from "additional_entries"')) return { rows: [row(schema.additionalEntries, stored)] };
      if (sql.includes('from "additional_entry_groups"')) return { rows: [row(schema.additionalEntryGroups, group)] };
      if (sql.includes('from "months"')) {
        return { rows: [row(schema.months, monthRow(sql.includes('inner join') ? parameters[0] : 1))] };
      }
      if (sql.startsWith('select "year" from')) return { rows: [[2026]] };
      if (sql.startsWith('select "year", "carry_over_version"')) return { rows: [[2026, 0]] };
      if (sql.includes('from "years"')) return { rows: [row(schema.years, yearRow)] };
      return { rows: [] };
    },
    release() {},
  }));
  t.mock.method(Pool.prototype, 'end', async () => {});
  return { events, current: () => stored };
}
const params = { params: Promise.resolve({ monthId: '1', entryId: '1' }) };
const request = (body) => new Request('http://gridly.test/api/entries', {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
});

test('POST defaults existing clients to ordinary expenses and roundtrips additional investments', async (t) => {
  const fixture = connection(t);
  const ordinary = await entries.POST(request({ type: 'expense', label: 'ETF', amount: 200 }), params);
  assert.equal(ordinary.status, 201);
  assert.equal((await ordinary.json()).isInvestment, false);
  const investment = await entries.POST(request({ type: 'expense', label: 'ETF', amount: 200, isInvestment: true }), params);
  assert.equal(investment.status, 201);
  assert.equal((await investment.json()).isInvestment, true);
  const loaded = await transaction.withFinancialTransaction('user-1', (db) => yearData.getYearData('user-1', 2026, db));
  assert.equal(loaded.months[0].additionalExpenses[0].isInvestment, true);
  assert.equal(loaded.months[0].totalExpenses, 500);
  assert.equal(loaded.months[0].endingBalance, 2500);
  assert.equal(fixture.current().isInvestment, true);
});

for (const body of [
  { isInvestment: 'true' }, { isInvestment: null }, { isInvestment: 1 },
  { type: 'income', isInvestment: true }, { groupId: 10, isInvestment: true },
]) {
  test(`POST rejects invalid investment without writes: ${JSON.stringify(body)}`, async (t) => {
    const { events } = connection(t);
    const response = await entries.POST(request({ type: 'expense', label: 'ETF', amount: 200, ...body }), params);
    assert.equal(response.status, 400);
    assert.equal(events.some((sql) => sql.startsWith('insert ')), false);
  });
}

test('PATCH marks and unmarks an existing expense without propagating balances', async (t) => {
  const { events } = connection(t);
  for (const isInvestment of [true, false]) {
    const response = await entry.PATCH(request({ isInvestment }), params);
    assert.equal(response.status, 200);
    assert.equal((await response.json()).isInvestment, isInvestment);
  }
  assert.equal(events.filter((sql) => sql.startsWith('update "additional_entries"')).length, 2);
  assert.equal(events.some((sql) => sql.includes('from "years"')), false);
});

test('PATCH preserves investment classification on label edits and month moves', async (t) => {
  const fixture = connection(t, { isInvestment: true });
  const renamed = await entry.PATCH(request({ label: 'ETF purchase' }), params);
  assert.equal((await renamed.json()).isInvestment, true);
  const moved = await entry.PATCH(request({ monthId: 2 }), params);
  assert.equal(moved.status, 200);
  assert.equal((await moved.json()).isInvestment, true);
  assert.equal(fixture.current().monthId, 2);
});

for (const [body, stored, status] of [
  [{ isInvestment: true }, { type: 'income' }, 400],
  [{ isInvestment: true }, { groupId: 10 }, 400],
  [{ isInvestment: 'true' }, {}, 400],
  [{ isInvestment: null }, {}, 400],
  [{ groupId: 10 }, { isInvestment: true }, 400],
  [{ isInvestment: true }, { isCompleted: true }, 409],
]) {
  test(`PATCH rejects invalid investment state without writes: ${JSON.stringify({ body, stored })}`, async (t) => {
    const { events } = connection(t, stored);
    const response = await entry.PATCH(request(body), params);
    assert.equal(response.status, status);
    assert.equal(events.some((sql) => sql.startsWith('update ')), false);
  });
}

test('an investment must be unmarked before it can move to a group', async (t) => {
  connection(t, { isInvestment: true });
  assert.equal((await entry.PATCH(request({ groupId: 10 }), params)).status, 400);
  assert.equal((await entry.PATCH(request({ isInvestment: false }), params)).status, 200);
  assert.equal((await entry.PATCH(request({ groupId: 10 }), params)).status, 200);
});

test('completed investments must be reopened before changing their classification', async (t) => {
  connection(t, { isCompleted: true, isInvestment: true });
  assert.equal((await entry.PATCH(request({ isInvestment: false }), params)).status, 409);
  assert.equal((await entry.PATCH(request({ isCompleted: false }), params)).status, 200);
  const response = await entry.PATCH(request({ isInvestment: false }), params);
  assert.equal(response.status, 200);
  assert.equal((await response.json()).isInvestment, false);
});
