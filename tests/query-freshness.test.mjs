import assert from 'node:assert/strict';
import { test } from 'node:test';
import { loadTs } from './load-ts.mjs';
const { createQueryCache } = loadTs('src/lib/query-cache.ts');
const { createQueryPersistence } = loadTs('src/lib/query-persistence.ts');
const { publicQuery, queryPolicy, queryUsage } = loadTs('src/lib/query-policy.ts');
const minute = 60_000, hour = 60 * minute, day = 24 * hour;
const tick = () => new Promise(setImmediate);
function setup() {
  let now = 1000, calls = 0;
  const cache = createQueryCache(async () => { calls++; return { application: null, store: null }; }, { now: () => now });
  return { cache, calls: () => calls, advance: amount => { now += amount; } };
}

test('place-label lookups share the public cache', async () => {
  assert.equal(publicQuery('/areas/place-id'), true);
  const policy = queryPolicy('/areas/place-id');
  assert.equal(policy.staleMs, day);
  assert.equal(policy.maxAgeMs, 7 * day);
  let calls = 0;
  const cache = createQueryCache(async () => { calls++; return { label: 'Test area' }; });
  await Promise.all(Array.from({ length: 3 }, () => cache.load('/areas/place-id', 'public')));
  for (let visit = 0; visit < 20; visit++) await cache.load('/areas/place-id', 'public');
  assert.equal(calls, 1);
});

test('freshness reflects how each screen uses data, including empty incoming-order lists', () => {
  for (const [path, data, expected] of [
    ['/me', null, Infinity], ['/config', null, 7 * day], ['/products?page=1', null, 6 * hour],
    ['/products/p', null, 15 * minute], ['/stores/s', null, 6 * hour], ['/seller/store', null, hour],
    ['/orders', { orders: [] }, 2 * minute], ['/seller/orders', { orders: [] }, 2 * minute],
    ['/seller/orders', { orders: [{ status: 'collected' }] }, 2 * minute],
    ['/orders', { orders: [{ status: 'ready' }] }, 2 * minute],
    ['/orders', { orders: [{ status: 'collected' }, { status: 'cancelled' }] }, 24 * hour],
  ]) assert.equal(queryUsage(path, data), expected, path);
});

test('idle collection keeps long-lived snapshots while respecting the existing memory budget', async () => {
  const h = setup(); await h.cache.load('/me', 'alice'); h.advance(2 * day);
  const stop = h.cache.subscribe('/products', 'public', () => {});
  stop(); // Run the same collector used when another screen unsubscribes.
  await h.cache.load('/me', 'alice');
  assert.equal(h.calls(), 1, 'a 30-minute idle eviction must not defeat week-long retention');
});

test('only a focused action context requests recent permissions; leaving it restores account cache reuse', async () => {
  const h = setup(); await h.cache.load('/me', 'alice');
  const accountStop = h.cache.observe('/me', 'alice');
  try {
    h.advance(day); h.cache.refreshActive(); await tick(); assert.equal(h.calls(), 1);
    const actionStop = h.cache.observe('/me', 'alice', minute);
    h.cache.refreshActive(); await tick(); assert.equal(h.calls(), 1, 'resuming does not check a retained action snapshot');
    await h.cache.load('/me', 'alice', false, minute); assert.equal(h.calls(), 2);
    actionStop(); h.advance(hour); h.cache.refreshActive(); await tick();
    assert.equal(h.calls(), 2, 'leaving the product/application screen removes its freshness requirement');
    h.cache.invalidate(path => path === '/me'); await h.cache.load('/me', 'alice');
    assert.equal(h.calls(), 3, 'permission rejection can still invalidate the long-lived status');
  } finally { accountStop(); }
});

test('retention limits remain enforced even when event-driven status has no short freshness timer', async () => {
  const h = setup(); await h.cache.load('/me', 'alice');
  h.advance(7 * day + 1); await h.cache.load('/me', 'alice');
  assert.equal(h.calls(), 2, 'load must enforce max age even without a preceding get');
});

test('day-old encrypted status survives an app restart with zero GETs and unchanged flushes add no writes', async t => {
  const rows = new Map(); let writes = 0;
  const storage = {
    read: async key => structuredClone(rows.get(key) || null),
    write: async (key, value) => { writes++; rows.set(key, structuredClone(value)); },
    clear: async key => { rows.delete(key); },
  };
  const first = setup(), p = createQueryPersistence(first.cache, storage); t.after(() => p.dispose());
  await p.activate('alice'); await first.cache.load('/me', 'alice'); await p.flush();
  const second = setup(), restored = createQueryPersistence(second.cache, storage); t.after(() => restored.dispose());
  second.advance(day); await restored.activate('alice'); await second.cache.load('/me', 'alice');
  assert.equal(second.calls(), 0); assert.ok(second.cache.get('/me', 'alice').data);
  await restored.flush(); const baseline = writes;
  for (let visit = 0; visit < 20; visit++) { await second.cache.load('/me', 'alice'); await restored.flush(); }
  assert.equal(second.calls(), 0); assert.equal(writes, baseline);
});

test('seller status gets disk-budget priority over a larger recently visited inventory snapshot', async t => {
  const h = setup(), rows = new Map();
  const p = createQueryPersistence(h.cache, {
    read: async () => null, clear: async () => {},
    write: async (key, value) => { rows.set(key, value); },
  });
  t.after(() => p.dispose()); await p.activate('alice');
  h.cache.set('/me', 'alice', { application: { notes: 'a'.repeat(5000) }, store: null });
  h.advance(1000); h.cache.set('/seller/store', 'alice', { products: [{ description: 'b'.repeat(27000) }] });
  await p.flush();
  const saved = rows.get('shopyethu.cache.account.v1');
  assert.equal(saved.rows.length, 1); assert.equal(saved.rows[0].path, '/me');
});
