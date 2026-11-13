import assert from 'node:assert/strict';
import { test } from 'node:test';
import { setImmediate } from 'node:timers/promises';
import { createApplicationDraftStore } from '../src/lib/application-draft-store.ts';

function setup() {
  const rows = new Map();
  let rejectWrites = false;
  const storage = {
    getItemAsync: async key => rows.get(key) ?? null,
    setItemAsync: async (key, value) => { if (typeof rejectWrites === 'function' ? rejectWrites(key) : rejectWrites) throw new Error('Storage unavailable'); rows.set(key, value); },
    deleteItemAsync: async key => { rows.delete(key); },
  };
  return { store: createApplicationDraftStore(storage), rows, fail: value => { rejectWrites = value; } };
}

test('draft storage restores long Unicode input using native-safe chunks', async () => {
  const { store, rows } = setup();
  const value = { plans: 'Handmade 🛍️ products\n'.repeat(300) };
  await store.write('account-one', value);
  assert.deepEqual(await store.read('account-one'), value);
  for (const chunk of rows.values()) assert.ok(Buffer.byteLength(chunk, 'utf8') < 2048);
});

test('failed saves preserve the last complete draft; later saves can recover', async () => {
  const { store, fail } = setup();
  await store.write('owner', { name: 'Original draft' });
  fail(true);
  await assert.rejects(store.write('owner', { name: 'Updated draft' }));
  assert.deepEqual(await store.read('owner'), { name: 'Original draft' });
  fail(false);
  await store.write('owner', { name: 'Recovered draft' });
  assert.deepEqual(await store.read('owner'), { name: 'Recovered draft' });
});

test('queued saves and clear are ordered and drafts stay separate per account', async () => {
  const { store, rows } = setup();
  await Promise.all([store.write('one', { step: 1 }), store.write('one', { step: 2 }), store.write('two', { step: 3 })]);
  assert.deepEqual(await store.read('one'), { step: 2 });
  rows.set('one.1.64', 'orphaned interrupted write');
  await Promise.all([store.write('one', { step: 3 }), store.clear('one')]);
  assert.equal(await store.read('one'), null);
  assert.equal([...rows.keys()].some(key => key.startsWith('one')), false);
  assert.deepEqual(await store.read('two'), { step: 3 });
});

test('missing or corrupt chunks are reported instead of restoring partial answers', async () => {
  const { store, rows } = setup();
  await store.write('owner', { name: 'Business name' });
  rows.delete('owner.0.0');
  await assert.rejects(store.read('owner'), /Incomplete/);
  rows.set('owner', '{broken');
  await assert.rejects(store.read('owner'));
  await store.clear('owner');
  await store.write('owner', { name: 'Fresh draft' });
  assert.deepEqual(await store.read('owner'), { name: 'Fresh draft' });
});

test('an interrupted manifest commit leaves the previous slot intact', async () => {
  const { store, fail } = setup();
  await store.write('owner', { plans: 'Previous complete answers' });
  fail(key => key === 'owner');
  await assert.rejects(store.write('owner', { plans: 'New answers '.repeat(500) }));
  assert.deepEqual(await store.read('owner'), { plans: 'Previous complete answers' });
  fail(false);
  await store.clear('owner');
  assert.equal(await store.read('owner'), null);
});

test('failed writes finish all native operations before a queued clear runs', async () => {
  const rows = new Map();
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  const store = createApplicationDraftStore({
    getItemAsync: async key => rows.get(key) ?? null,
    setItemAsync: async (key, value) => {
      if (key === 'owner.0.0') throw new Error('First chunk failed');
      await gate;
      rows.set(key, value);
    },
    deleteItemAsync: async key => { rows.delete(key); },
  });
  let cleared = false;
  const saving = assert.rejects(store.write('owner', { plans: 'Long input '.repeat(100) }));
  const clearing = store.clear('owner').then(() => { cleared = true; });
  await setImmediate();
  assert.equal(cleared, false);
  release();
  await Promise.all([saving, clearing]);
  assert.equal(rows.size, 0);
});
