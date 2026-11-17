import assert from 'node:assert/strict';
import { test } from 'node:test';
import { loadTs } from './load-ts.mjs';
const { createQueryCache } = loadTs('src/lib/query-cache.ts');
const { createQueryPersistence } = loadTs('src/lib/query-persistence.ts');
const { publicQuery, canReuseSnapshot } = loadTs('src/lib/query-policy.ts');
const minute = 60_000, hour = 60 * minute, day = 24 * hour;
const tick = () => new Promise(setImmediate);
function setup() {
  let now = 1000, calls = 0;
  const cache = createQueryCache(async () => { calls++; return { application: null, store: null }; }, { now: () => now });
  return { cache, calls: () => calls, advance: amount => { now += amount; } };
}

test('place-label lookups share the public cache', async () => {
  assert.equal(publicQuery('/areas/place-id'), true);
  assert.equal(canReuseSnapshot({ data: { label: 'Test area' }, updatedAt: 0 }), true);
  let calls = 0;
  const cache = createQueryCache(async () => { calls++; return { label: 'Test area' }; });
  await Promise.all(Array.from({ length: 3 }, () => cache.load('/areas/place-id', 'public')));
  for (let visit = 0; visit < 20; visit++) await cache.load('/areas/place-id', 'public');
  assert.equal(calls, 1);
});

test('saved snapshots, including empty and active order lists, need no time-based status checks', () => {
  for (const data of [{ orders: [] }, { orders: [{ status: 'ready' }] }, { orders: [{ status: 'collected' }] }, { application: null }, { products: [] }]) {
    assert.equal(canReuseSnapshot({ data, updatedAt: 0 }), true);
    assert.equal(canReuseSnapshot({ data, updatedAt: null }), false);
  }
  assert.equal(canReuseSnapshot({ data: null, updatedAt: 1000 }), false);
});

test('revisiting every resource type for ninety days adds no reads until explicit refresh', async () => {
  let now = 1000, calls = 0;
  const cache = createQueryCache(async () => { calls++; return { products: [] }; }, { now: () => now });
  const paths = ['/products?page=1', '/products/p', '/stores/s?page=1', '/seller/store', '/seller/products/p', '/orders', '/seller/orders', '/me', '/config', '/areas/place-id'];
  for (const path of paths) await cache.load(path, publicQuery(path) ? 'public' : 'alice');
  for (let visit = 0; visit < 10; visit++) {
    now += 9 * day;
    for (const path of paths) await cache.load(path, publicQuery(path) ? 'public' : 'alice');
    cache.refreshActive();
  }
  assert.equal(calls, paths.length);
  await cache.load('/seller/store', 'alice', true);
  assert.equal(calls, paths.length + 1, 'explicit refresh still obtains current data');
});

test('idle collection keeps long-lived snapshots while respecting the existing memory budget', async () => {
  const h = setup(); await h.cache.load('/me', 'alice'); h.advance(2 * day);
  const stop = h.cache.subscribe('/products', 'public', () => {});
  stop(); // Run the same collector used when another screen unsubscribes.
  await h.cache.load('/me', 'alice');
  assert.equal(h.calls(), 1, 'a 30-minute idle eviction must not defeat week-long retention');
});

test('only an explicit status-check action or known invalidation reloads saved status', async () => {
  const h = setup(); await h.cache.load('/me', 'alice');
  const accountStop = h.cache.observe('/me', 'alice');
  try {
    h.advance(day); h.cache.refreshActive(); await tick(); assert.equal(h.calls(), 1);
    await h.cache.load('/me', 'alice'); assert.equal(h.calls(), 1, 'opening status is still a cache read');
    await h.cache.load('/me', 'alice', true); assert.equal(h.calls(), 2, 'Check status deliberately reaches the server');
    h.advance(90 * day); h.cache.refreshActive(); await tick();
    assert.equal(h.calls(), 2, 'saved status does not expire on resume');
    h.cache.invalidate(path => path === '/me'); await h.cache.load('/me', 'alice');
    assert.equal(h.calls(), 3, 'permission rejection can still invalidate the long-lived status');
  } finally { accountStop(); }
});

test('a known change invalidates status immediately without waiting for any timer', async () => {
  const h = setup(); await h.cache.load('/me', 'alice');
  h.cache.invalidate(path => path === '/me'); await h.cache.load('/me', 'alice');
  assert.equal(h.calls(), 2);
});

test('ninety-day-old encrypted status survives restart with zero GETs and unchanged flushes add no writes', async t => {
  const rows = new Map(); let writes = 0;
  const storage = {
    read: async key => structuredClone(rows.get(key) || null),
    write: async (key, value) => { writes++; rows.set(key, structuredClone(value)); },
    clear: async key => { rows.delete(key); },
  };
  const first = setup(), p = createQueryPersistence(first.cache, storage); t.after(() => p.dispose());
  await p.activate('alice'); await first.cache.load('/me', 'alice'); await p.flush();
  const second = setup(), restored = createQueryPersistence(second.cache, storage); t.after(() => restored.dispose());
  second.advance(90 * day); await restored.activate('alice'); await second.cache.load('/me', 'alice');
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
