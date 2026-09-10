import test from 'node:test';
import assert from 'node:assert/strict';
import { Pool, Client, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import { generateDrizzleJson, generateMigration } from 'drizzle-kit/api';
import { loadFinancialModules, financialModulePaths } from '../tests/helpers/financial-modules.mjs';



function databaseIdentity(value) {
  const url = new URL(value);
  return `${url.hostname.replace('-pooler', '')}:${url.port}${url.pathname}`;
}
function deferred() {
  let resolve;
  const promise = new Promise((done) => { resolve = done; });
  return { promise, resolve };
}
async function bounded(promise) {
  let timer;
  try {
    return await Promise.race([promise, new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error('Timed out waiting for transaction barrier')), 10000);
    })]);
  } finally { clearTimeout(timer); }
}

// Intentionally separate from npm test: a missing test connection is a failure,
// never a silent skip or a fallback to the application's database.
test('financial operations are atomic on isolated Neon', { timeout: 180000 }, async (t) => {
  const testUrl = process.env.TEST_DATABASE_URL;
  assert.ok(testUrl, 'Configure TEST_DATABASE_URL with an isolated Neon branch/database');
  const previousUrl = process.env.DATABASE_URL;
  if (previousUrl) assert.notEqual(databaseIdentity(testUrl), databaseIdentity(previousUrl), 'TEST_DATABASE_URL must not identify the application database');
  neonConfig.webSocketConstructor = ws;
  const namespace = `atomic_${crypto.randomUUID().replaceAll('-', '')}`;
  const admin = new Pool({ connectionString: testUrl });
  const scopedUrl = new URL(testUrl);
  // Use the same branch's direct endpoint so startup search_path is session-scoped.
  scopedUrl.hostname = scopedUrl.hostname.replace('-pooler', '');
  scopedUrl.searchParams.set('options', `${scopedUrl.searchParams.get('options') ?? ''} -c search_path=${namespace}`.trim());
  process.env.DATABASE_URL = scopedUrl.href;
  let fixture;
  let harness;
  let schemaCreated = false;
  let beforeQuery;
  let afterQuery;
  const originalQuery = Client.prototype.query;
  const interception = t.mock.method(Client.prototype, 'query', function (...args) {
    if (typeof args.at(-1) === 'function') return originalQuery.apply(this, args);
    const query = typeof args[0] === 'string' ? args[0] : args[0].text;
    return (async () => {
      await beforeQuery?.(query, args[1] ?? []);
      const result = await originalQuery.apply(this, args);
      await afterQuery?.(query, args[1] ?? []);
      return result;
    })();
  });
  try {
    await admin.query(`create schema "${namespace}"`);
    schemaCreated = true;
    fixture = new Pool({ connectionString: scopedUrl.href });
    harness = await loadFinancialModules(financialModulePaths);
    const { modules: m, state } = harness;
    const migration = await generateMigration(generateDrizzleJson({}), generateDrizzleJson(m.schema));
    for (const statement of migration) {
      await fixture.query(statement.replaceAll('"public".', `"${namespace}".`));
    }
    const userId = crypto.randomUUID();
    state.user = { id: userId };
    await fixture.query('insert into users (id, email) values ($1, $2)', [userId, `${userId}@example.test`]);
    const config = (year) => ({ year, startingBalance: 100, estimatedSalary: 100,
      hasExtraPayments: true, estimatedExtraPayment: 50, monthlyInvestment: 10,
      monthlyHomeExpense: 10, monthlyPersonalBudget: 10, interestRate: 0.12,
      recurringExpenses: [{ label: 'Subscription', amount: 10 }] });
    for (const year of [2030, 2031, 2032]) await m.action.createAndPrefillYear(config(year));
    const monthRows = (await fixture.query('select id, year_id, month from months order by year_id, month')).rows;
    const january = monthRows[0];
    const february = monthRows[1];
    const tag = (await fixture.query('insert into tags (user_id, name, color) values ($1, $2, $3) returning id', [userId, 'Test', 'purple'])).rows[0];
    const group = (await fixture.query('insert into additional_entry_groups (month_id, label, tag_id) values ($1, $2, $3) returning id', [january.id, 'Trip', tag.id])).rows[0];
    const entry = (await fixture.query('insert into additional_entries (month_id, group_id, type, label, amount, tag_id) values ($1, $2, $3, $4, $5, $6) returning id', [january.id, group.id, 'expense', 'Ticket', 5, tag.id])).rows[0];
    await fixture.query('insert into additional_entries (month_id, type, label, amount, is_recurring, is_completed, tag_id) values ($1, $2, $3, $4, true, true, $5)', [monthRows[24].id, 'income', 'Recurring gift', 8, tag.id]);
    await fixture.query('update year_recurring_expenses set tag_id = $1', [tag.id]);
    await fixture.query('update monthly_recurring_expenses set tag_id = $1', [tag.id]);
    await m.transaction.withFinancialTransaction(userId, (tx) => m.carry.propagateYearCarryOver(userId, 2030, tx));
    state.invalidations.length = 0;

    const call = (route, method, params, body) => m[route][method](
      new Request('http://gridly.test/api', { method, ...(body === undefined ? {} : { body: JSON.stringify(body) }) }),
      { params: Promise.resolve(Object.fromEntries(Object.entries(params).map(([key, value]) => [key, String(value)]))) },
    );
    const tables = ['users', 'years', 'months', 'year_recurring_expenses', 'monthly_recurring_expenses', 'additional_entry_groups', 'additional_entries', 'tags'];
    async function snapshot() {
      const result = {};
      for (const table of tables) result[table] = (await fixture.query(`select * from "${table}" order by id`)).rows;
      return result;
    }
    async function rollbackCase(name, pattern, operation) {
      await t.test(name, async () => {
        const before = await snapshot();
        const invalidations = state.invalidations.length;
        let injected = false;
        afterQuery = (query) => {
          if (!injected && pattern.test(query)) { injected = true; throw new Error('injected write failure'); }
        };
        try { await assert.rejects(operation); }
        finally { afterQuery = undefined; }
        assert.ok(injected, 'fault must actually reach the intended SQL boundary');
        assert.deepEqual(await snapshot(), before);
        assert.equal(state.invalidations.length, invalidations, 'failed writes must not invalidate caches');
      });
    }
    await t.test('a database numeric constraint failure rolls back year creation', async () => {
      const before = await snapshot();
      await assert.rejects(m.action.createAndPrefillYear({
        ...config(2033), recurringExpenses: [{ label: 'Overflow', amount: 1e100 }],
      }));
      assert.deepEqual(await snapshot(), before);
      assert.deepEqual(state.invalidations, []);
    });
    await rollbackCase('year insert rolls back and leaves its number retryable', /^insert into "years"/, () => m.action.createAndPrefillYear(config(2033)));
    await rollbackCase('prefill restores cascaded groups, entries and monthly copies', /^delete from "months"/, () => call('prefill', 'POST', { year: 2030 }));
    await rollbackCase('template deletion restores earlier monthly links and tags', /^delete from "year_recurring_expenses"/, () => call('templates', 'PUT', { year: 2030 }, { recurringExpenses: [{ label: 'Subscription', amount: 20 }], applyFromMonth: 6 }));
    await rollbackCase('template rebuild rolls back all selected copies', /^insert into "monthly_recurring_expenses"/, () => call('templates', 'PUT', { year: 2030 }, { recurringExpenses: [{ label: 'Subscription', amount: 20 }], applyFromMonth: 6 }));
    await rollbackCase('group move restores parent and child month IDs', /^update "additional_entry_groups"/, () => call('group', 'PATCH', { monthId: january.id, groupId: group.id }, { monthId: february.id }));
    await rollbackCase('failure midway through carry-over restores mutation, balances and versions', /^update "years" set "starting_balance"/, () => call('month', 'PATCH', { monthId: january.id }, { payslip: 200 }));
    await rollbackCase('annual configuration and baseline updates roll back together', /^update "months"/, () => call('year', 'PATCH', { year: 2030 }, { estimatedSalary: 150, applyFromMonth: 6 }));
    await rollbackCase('year deletion restores every cascaded record', /^delete from "years"/, () => call('year', 'DELETE', { year: 2032 }));
    const recurring = (await fixture.query('select id from monthly_recurring_expenses where month_id = $1 order by id', [january.id])).rows[0];
    await rollbackCase('series tag changes roll back template and all monthly copies', /^update "monthly_recurring_expenses"/, () => call('recurring', 'PATCH', { monthId: january.id, entryId: recurring.id }, { tagId: null }));

    async function chainIsConsistent() {
      await m.transaction.withFinancialTransaction(userId, async (tx) => {
        const years = await m.data.getYearsForUser(userId, tx);
        let previous;
        for (const year of years) {
          const data = await m.data.getYearData(userId, year, tx);
          if (previous) assert.equal(data.config.startingBalance, Math.round((previous.months.at(-1).endingBalance + Number.EPSILON) * 100) / 100);
          previous = data;
        }
      });
    }
    async function concurrent(name, firstPattern, first, second) {
      await t.test(name, async () => {
        const entered = deferred();
        const release = deferred();
        const secondLock = deferred();
        let paused = false;
        let secondRequested = false;
        let secondAcquired = false;
        beforeQuery = (query) => { if (secondRequested && /for update/.test(query)) secondLock.resolve(); };
        afterQuery = async (query) => {
          if (secondRequested && /for update/.test(query)) secondAcquired = true;
          if (!paused && firstPattern.test(query)) { paused = true; entered.resolve(); await release.promise; }
        };
        const firstRun = first();
        firstRun.catch(() => {});
        let secondRun;
        try {
          try {
            await bounded(entered.promise);
            secondRequested = true;
            secondRun = second();
            secondRun.catch(() => {});
            await bounded(secondLock.promise);
            assert.equal(secondAcquired, false, 'second writer must wait for the first user lock');
          } finally { release.resolve(); }
          const results = await Promise.all([firstRun, secondRun]);
          for (const result of results) if (result instanceof Response) assert.ok(result.ok || result.status === 404);
        } finally {
          release.resolve();
          await Promise.allSettled([firstRun, secondRun]);
          beforeQuery = undefined;
          afterQuery = undefined;
        }
        await chainIsConsistent();
      });
    }
    await concurrent('predecessor edit and retrying year creation serialize', /^update "months"/, () => call('month', 'PATCH', { monthId: monthRows[24].id }, { payslip: 250 }), () => m.action.createAndPrefillYear(config(2033)));
    await t.test('successful retry creates twelve months and reopens tagged recurring entries', async () => {
      const rows = (await fixture.query('select m.month, e.* from additional_entries e join months m on m.id = e.month_id join years y on y.id = m.year_id where y.year = 2033')).rows;
      assert.equal(rows.length, 1);
      assert.equal(rows[0].is_completed, false);
      assert.equal(rows[0].tag_id, tag.id);
      assert.equal((await fixture.query('select count(*)::int as n from months m join years y on y.id = m.year_id where y.year = 2033')).rows[0].n, 12);
    });
    await concurrent('edits in different years keep the full chain consistent', /^update "months"/, () => call('month', 'PATCH', { monthId: january.id }, { payslip: 210 }), () => call('month', 'PATCH', { monthId: monthRows[12].id }, { payslip: 220 }));
    await concurrent('group move and child edit cannot split their month ownership', /^update "additional_entry_groups"/, () => call('group', 'PATCH', { monthId: january.id, groupId: group.id }, { monthId: february.id }), () => call('entry', 'PATCH', { monthId: january.id, entryId: entry.id }, { amount: 9 }));
    await t.test('moved group and all children share their month', async () => {
      const rows = (await fixture.query('select e.month_id as child, g.month_id as parent from additional_entries e join additional_entry_groups g on g.id = e.group_id')).rows;
      assert.ok(rows.length);
      for (const row of rows) assert.equal(row.child, row.parent);
    });
    await t.test('invalid applyFromMonth rejects before changing any rows', async () => {
      const before = await snapshot();
      for (const route of ['templates', 'year']) {
        const response = await call(route, route === 'year' ? 'PATCH' : 'PUT', { year: 2030 }, {
          applyFromMonth: 0, estimatedSalary: 900, recurringExpenses: [],
        });
        assert.equal(response.status, 400);
      }
      assert.deepEqual(await snapshot(), before);
    });
    await t.test('applyFromMonth preserves earlier values and matching template tags', async () => {
      const before = (await fixture.query('select id, label, amount, tag_id from monthly_recurring_expenses where month_id = $1', [january.id])).rows;
      const response = await call('templates', 'PUT', { year: 2030 }, { recurringExpenses: [{ label: 'Subscription', amount: 20 }], applyFromMonth: 6 });
      assert.equal(response.status, 200);
      assert.deepEqual((await fixture.query('select id, label, amount, tag_id from monthly_recurring_expenses where month_id = $1', [january.id])).rows, before);
      const body = await response.json();
      assert.equal(body.recurringExpenses[0].tagId, tag.id);
      assert.equal(body.yearData.months[5].recurringExpenses[0].amount, 20);
    });
    await t.test('metadata-only edits do not increment carry-over versions', async () => {
      const versions = (await fixture.query('select id, carry_over_version from years order by id')).rows;
      const response = await call('entry', 'PATCH', { monthId: february.id, entryId: entry.id }, { label: 'Renamed', amount: 5 });
      assert.equal(response.status, 200);
      assert.deepEqual((await fixture.query('select id, carry_over_version from years order by id')).rows, versions);
    });
    await concurrent('prefill and entry insertion serialize ownership checks', /^delete from "months"/, () => call('prefill', 'POST', { year: 2030 }), () => call('entries', 'POST', { monthId: january.id }, { type: 'expense', label: 'Late', amount: 5 }));
    await t.test('REST creation preserves the configuration-only then prefill contract', async () => {
      const response = await call('years', 'POST', {}, config(2034));
      assert.equal(response.status, 201);
      const row = await response.json();
      assert.equal('carryOverVersion' in row, false);
      assert.equal((await fixture.query('select count(*)::int as n from months where year_id = $1', [row.id])).rows[0].n, 0);
      const prefilled = await call('prefill', 'POST', { year: 2034 });
      assert.equal(prefilled.status, 201);
      assert.equal((await prefilled.json()).length, 12);
      await chainIsConsistent();
    });
  } finally {
    beforeQuery = undefined;
    afterQuery = undefined;
    interception.mock.restore();
    if (fixture) await fixture.end();
    if (schemaCreated) await admin.query(`drop schema "${namespace}" cascade`);
    await admin.end();
    await harness?.cleanup();
    if (previousUrl === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = previousUrl;
  }
});
