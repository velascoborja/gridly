import test from 'node:test';
import assert from 'node:assert/strict';
import { after } from 'node:test';
import { Pool } from '@neondatabase/serverless';
import { loadFinancialModules } from './helpers/financial-modules.mjs';

const harness = await loadFinancialModules({ transaction: 'src/db/financial-transaction.ts' });
after(harness.cleanup);
const { withFinancialTransaction } = harness.modules.transaction;

function connection(t, { userExists = true, failCommit = false, failBegin = false } = {}) {
  const previous = process.env.DATABASE_URL;
  process.env.DATABASE_URL = 'postgresql://unused:unused@localhost/unused';
  t.after(() => {
    if (previous === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = previous;
  });
  const events = [];
  t.mock.method(Pool.prototype, 'connect', async () => ({
    query: async (query) => {
      const text = typeof query === 'string' ? query : query.text;
      events.push(text);
      if (failBegin && text.startsWith('begin')) throw new Error('begin failed');
      if (failCommit && text === 'commit') throw new Error('connection lost');
      return { rows: text.includes('for update') && userExists ? [['user-1']] : [] };
    },
    release: () => events.push('release'),
  }));
  t.mock.method(Pool.prototype, 'end', async () => { events.push('end'); });
  return events;
}

test('financial transaction locks its user before work and commits before returning', async (t) => {
  const events = connection(t);
  const result = await withFinancialTransaction('user-1', async () => {
    events.push('operation');
    return 42;
  });
  assert.equal(result, 42);
  assert.match(events[0], /begin.*read committed/);
  assert.match(events[1], /from "users".*for update/);
  assert.deepEqual(events.slice(2), ['operation', 'commit', 'release', 'end']);
});

test('callback failure rolls back and releases the connection without retrying', async (t) => {
  const events = connection(t);
  const failure = new Error('injected failure');
  await assert.rejects(withFinancialTransaction('user-1', async () => {
    events.push('operation');
    throw failure;
  }), (error) => error === failure);
  assert.deepEqual(events.slice(2), ['operation', 'rollback', 'release', 'end']);
});

test('an ambiguous commit failure never repeats the operation', async (t) => {
  const events = connection(t, { failCommit: true });
  let calls = 0;
  await assert.rejects(withFinancialTransaction('user-1', async () => { calls++; }), (error) => error.cause?.message === 'connection lost');
  assert.equal(calls, 1);
  assert.deepEqual(events.slice(2), ['commit', 'rollback', 'release', 'end']);
});

test('a deleted user cannot start a financial mutation', async (t) => {
  const events = connection(t, { userExists: false });
  await assert.rejects(withFinancialTransaction('user-1', async () => assert.fail('must not run')), /User not found/);
  assert.deepEqual(events.slice(2), ['rollback', 'release', 'end']);
});

test('connection cleanup errors do not report a committed save as failed', async (t) => {
  const events = connection(t);
  t.mock.method(Pool.prototype, 'end', async () => { throw new Error('cleanup failed'); });
  const log = t.mock.method(console, 'error', () => {});
  assert.equal(await withFinancialTransaction('user-1', async () => 42), 42);
  assert.equal(events.at(-2), 'commit');
  assert.equal(log.mock.callCount(), 1);
});

test('BEGIN failure still releases the checkout and closes the pool', async (t) => {
  const events = connection(t, { failBegin: true });
  await assert.rejects(withFinancialTransaction('user-1', async () => assert.fail('must not run')),
    (error) => error.cause?.message === 'begin failed');
  assert.equal(events.length, 3);
  assert.deepEqual(events.slice(1), ['release', 'end']);
});

test('connection failure closes the pool without starting work or retrying', async (t) => {
  const events = connection(t);
  const connect = t.mock.method(Pool.prototype, 'connect', async () => { throw new Error('connect failed'); });
  await assert.rejects(withFinancialTransaction('user-1', async () => assert.fail('must not run')), /connect failed/);
  assert.equal(connect.mock.callCount(), 1);
  assert.deepEqual(events, ['end']);
});
