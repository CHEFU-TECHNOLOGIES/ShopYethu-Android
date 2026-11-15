import assert from 'node:assert/strict';
import { test } from 'node:test';
import { loadTs } from './load-ts.mjs';
const { createQueryCache } = loadTs('src/lib/query-cache.ts');
const { createQueryPersistence } = loadTs('src/lib/query-persistence.ts');
const { canonicalPath, queryPolicy } = loadTs('src/lib/query-policy.ts');
const { createCartStore } = loadTs('src/lib/cart-store.ts');
const { createToastStore } = loadTs('src/lib/toast.ts');
const tick = () => new Promise(setImmediate);
const failure = status => Object.assign(new Error(`Failure ${status}`), { status });
function setup(options = {}) {
  let now = 1000, calls = 0, respond = async () => ({ products: [] });
  const cache = createQueryCache((...args) => { calls++; return respond(...args); }, { now: () => now, wait: async () => {}, ...options });
  return { cache, calls: () => calls, advance: amount => { now += amount; }, respond: fn => { respond = fn; } };
}
function storage() {
  const rows = new Map(), writes = [];
  return { rows, writes, read: async key => structuredClone(rows.get(key) || null),
    write: async (key, data) => { writes.push(key); rows.set(key, structuredClone(data)); },
    clear: async key => { rows.delete(key); } };
}

test('stable keys normalize empty filters, query order, case and old order cache busters', () => {
  assert.equal(canonicalPath('/products?q=Shoes&category=&page=1'), '/products?page=1&q=shoes');
  assert.equal(canonicalPath('/orders?updated=abc'), '/orders');
  assert.equal(queryPolicy('/me').staleMs, 300000);
  assert.equal(queryPolicy('/orders', { orders: [{ status: 'placed' }] }).staleMs, 30000);
});
test('three simultaneous consumers and twenty repeat visits use one GET, not twenty-three', async () => {
  const h = setup();
  await Promise.all([h.cache.load('/products', 'public'), h.cache.load('/products', 'public'), h.cache.load('/products', 'public')]);
  for (let visit = 0; visit < 20; visit++) await h.cache.load('/products', 'public');
  assert.equal(h.calls(), 1);
  assert.ok(h.cache.get('/products', 'public').data);
  h.advance(120000); await h.cache.load('/products', 'public'); assert.equal(h.calls(), 2);
});
test('cached data stays visible during an expired background read and survives network failure', async () => {
  const h = setup(); await h.cache.load('/products', 'public'); h.advance(120000);
  let finish; h.respond(() => new Promise(resolve => { finish = resolve; }));
  const request = h.cache.load('/products', 'public'); await tick();
  assert.ok(h.cache.get('/products', 'public').data); assert.equal(h.cache.get('/products', 'public').loading, true);
  finish({ products: [{ id: 'new' }] }); await request;
  h.respond(async () => { throw failure(0); }); await h.cache.load('/products', 'public', true);
  assert.equal(h.cache.get('/products', 'public').data.products[0].id, 'new');
  assert.equal(h.calls(), 5); await h.cache.load('/products', 'public'); assert.equal(h.calls(), 5, 'cooldown prevents a navigation retry storm');
});
test('manual refresh bypasses freshness and still deduplicates; unchanged responses preserve data identity', async () => {
  const h = setup(); await h.cache.load('/products', 'public'); const before = h.cache.get('/products', 'public').data;
  await Promise.all([h.cache.load('/products', 'public', true), h.cache.load('/products', 'public', true)]);
  assert.equal(h.calls(), 2); assert.equal(h.cache.get('/products', 'public').data, before);
});
test('transient reads retry with exponential delays; validation and permissions never retry', async () => {
  const delays = [], h = setup({ wait: async ms => { delays.push(ms); } });
  h.respond(async () => { if (h.calls() < 3) throw failure(503); return { products: [] }; });
  await h.cache.load('/products', 'public'); assert.equal(h.calls(), 3);
  assert.ok(delays[0] >= 500 && delays[0] < 700); assert.ok(delays[1] >= 1000 && delays[1] < 1200);
  for (const code of [400, 401, 403, 404, 409]) {
    const previous = h.calls(); h.respond(async () => { throw failure(code); });
    await h.cache.load('/seller/store', 'alice', true); assert.equal(h.calls(), previous + 1);
  }
});
test('accounts are isolated and logout drops pending responses even after returning to the same uid', async () => {
  const h = setup(); h.cache.set('/me', 'bob', { application: 'Bob' });
  let finish; h.respond(() => new Promise(resolve => { finish = resolve; }));
  const request = h.cache.load('/me', 'alice'); await tick();
  assert.equal(h.cache.get('/me', 'alice').data, null); h.cache.clearPrivate();
  finish({ application: 'Alice' }); await request;
  assert.equal(h.cache.get('/me', 'alice').data, null); assert.equal(h.cache.get('/me', 'bob').data, null);
});
test('permission rejection removes the protected snapshot; a confirmed write wins over an older GET', async () => {
  const h = setup(); h.cache.set('/seller/store', 'alice', { store: 'old' });
  let finish; h.respond(() => new Promise(resolve => { finish = resolve; }));
  const request = h.cache.load('/seller/store', 'alice', true); await tick();
  h.cache.set('/seller/store', 'alice', { store: 'saved' }); finish({ store: 'old' }); await request;
  assert.equal(h.cache.get('/seller/store', 'alice').data.store, 'saved');
  h.respond(async () => { throw failure(403); }); await h.cache.load('/seller/store', 'alice', true);
  assert.equal(h.cache.get('/seller/store', 'alice').data, null);
});
test('targeted invalidation leaves unrelated queries fresh and keeps existing content', async () => {
  const h = setup(); await h.cache.load('/products', 'public'); await h.cache.load('/orders', 'alice');
  h.cache.invalidate(path => path.startsWith('/products'));
  assert.ok(h.cache.get('/products', 'public').data);
  await h.cache.load('/orders', 'alice'); assert.equal(h.calls(), 2);
  await h.cache.load('/products', 'public'); assert.equal(h.calls(), 3);
});
test('foreground refresh reads only stale observed queries; cancelling discards obsolete searches', async () => {
  const h = setup(); await h.cache.load('/products', 'public'); await h.cache.load('/orders', 'alice');
  const stop = h.cache.observe('/products', 'public'); h.advance(120000); h.cache.refreshActive(); await tick();
  assert.equal(h.calls(), 3); stop();
  let signal; h.respond((_path, incoming) => { signal = incoming; return new Promise(() => {}); });
  void h.cache.load('/products?q=old', 'public'); await tick(); h.cache.cancelAll();
  assert.equal(signal.aborted, true); assert.equal(h.cache.get('/products?q=old', 'public').loading, false);
});
test('garbage collection bounds inactive queries by count and approximate payload size', async () => {
  const h = setup({ maxEntries: 3 });
  for (let id = 0; id < 20; id++) await h.cache.load(`/products/${id}`, 'public');
  assert.ok(h.cache.export('public').length <= 3);
  const small = setup({ maxBytes: 100 }); small.respond(async () => ({ text: 'x'.repeat(500) }));
  await small.cache.load('/products', 'public'); assert.equal(small.cache.export('public').length, 0);
});
test('encrypted persistence restores a fresh snapshot without another GET and bounds complete snapshots', async t => {
  const disk = storage(), first = setup(), persist = createQueryPersistence(first.cache, disk); t.after(() => persist.dispose());
  await persist.activate('alice'); await first.cache.load('/products', 'public'); await first.cache.load('/me', 'alice');
  first.cache.set('/products/huge', 'public', { text: 'x'.repeat(40000) }); await persist.flush();
  assert.ok(JSON.stringify(disk.rows.get('shopyethu.cache.public.v1')).length <= 30000);
  assert.equal(disk.rows.get('shopyethu.cache.public.v1').rows.length, 1, 'oversized snapshots are omitted, never truncated');
  const second = setup(), restore = createQueryPersistence(second.cache, disk); t.after(() => restore.dispose());
  await restore.activate('alice'); await second.cache.load('/products', 'public'); await second.cache.load('/me', 'alice');
  assert.equal(second.calls(), 0); assert.ok(second.cache.get('/me', 'alice').data);
  const writes = disk.writes.length; await restore.flush(); await restore.flush();
  assert.equal(disk.writes.length, writes + 2, 'unchanged flushes do not write again');
});
test('switching accounts removes disk snapshots and a different uid cannot hydrate them', async t => {
  const disk = storage(), h = setup(), p = createQueryPersistence(h.cache, disk); t.after(() => p.dispose());
  await p.activate('alice'); h.cache.set('/me', 'alice', { name: 'Alice' }); await p.flush();
  h.cache.clearPrivate(); await p.activate('bob'); await p.flush();
  assert.equal(disk.rows.get('shopyethu.cache.account.v1').scope, 'bob');
  assert.equal(disk.rows.get('shopyethu.cache.account.v1').rows.length, 0);
  await p.activate(null); assert.equal(disk.rows.has('shopyethu.cache.account.v1'), false);
});
test('cache schema, future timestamps and expired data are ignored on restore', () => {
  const h = setup(); h.cache.restore([{ path: '/me', scope: 'alice', data: {}, updatedAt: 2000 }], 'alice');
  assert.equal(h.cache.get('/me', 'alice').data, null);
  h.advance(4000000); h.cache.restore([{ path: '/me', scope: 'alice', data: {}, updatedAt: 1000 }], 'alice');
  assert.equal(h.cache.get('/me', 'alice').data, null);
});

test('basket changes are immediate and coalesced; order key is durable before a send and survives restart', async () => {
  const disk = storage(), cart = createCartStore(disk); await cart.activate('alice');
  const product = { id: 'p', storeId: 's', priceCents: 100, fulfilment: ['collection'] };
  cart.change(() => [{ product, quantity: 1 }]); cart.change(lines => lines.map(line => ({ ...line, quantity: 2 })));
  assert.equal(cart.get().items[0].quantity, 2); assert.equal(disk.writes.length, 0);
  await cart.reserve({ key: 'durable-order-key', body: '{"items":[]}' });
  assert.equal(disk.rows.get('shopyethu.basket.v1').attempt.key, 'durable-order-key');
  const reopened = createCartStore(disk); await reopened.activate('alice');
  assert.equal(reopened.get().attempt.key, 'durable-order-key');
  assert.throws(() => reopened.change(() => []), /previous order/);
  await reopened.complete(); assert.equal(reopened.get().items.length, 0); assert.equal(disk.rows.get('shopyethu.basket.v1').attempt, null);
});
test('basket activation deduplicates concurrent hydration and clears account data on sign-out', async () => {
  const disk = storage(), cart = createCartStore(disk); await Promise.all([cart.activate('alice'), cart.activate('alice')]);
  assert.equal(cart.get().ready, true);
  await cart.reserve({ key: 'attempt', body: '{}' }); await cart.activate(null);
  assert.equal(cart.get().items.length, 0); assert.equal(disk.rows.has('shopyethu.basket.v1'), false);
  await cart.activate('bob'); assert.equal(cart.get().attempt, null);
});
test('toast deduplication, bounded queue, dismissal and identity clearing are centralized', () => {
  const toast = createToastStore(); let changes = 0; toast.subscribe(() => changes++);
  toast.show('Saved', 'success'); toast.show('Saved', 'success'); assert.equal(changes, 1);
  for (const text of ['Two', 'Three', 'Four']) toast.show(text, 'info');
  assert.equal(toast.get().length, 3); toast.dismiss(toast.get()[0].id); assert.equal(toast.get().length, 2);
  toast.clear(); assert.equal(toast.get().length, 0);
});
