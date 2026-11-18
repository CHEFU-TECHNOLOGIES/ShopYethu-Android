import assert from 'node:assert/strict';
import { test } from 'node:test';
import * as jsx from 'react/jsx-runtime';
import { loadTs } from './load-ts.mjs';
const tick = () => new Promise(setImmediate);

function market() {
  const sessions = [], rejections = [], mutations = [], calls = [], notices = [];
  let identity = 'alice';
  class ApiError extends Error { constructor(message, status) { super(message); this.status = status; } }
  const exports = loadTs('src/lib/market-cache.ts', {
    'expo-secure-store': {},
    './application-draft-store': { createApplicationDraftStore: () => ({ read: async () => null, write: async () => {}, clear: async () => {} }) },
    './api': { ApiError, api: async path => { calls.push(path); return path === '/me' ? { application: null, store: null } : { products: [] }; } },
    './session': { currentSession: () => identity ? { user: { uid: identity } } : null, subscribe: listener => sessions.push(listener) },
    './api-events': { onApiMutation: listener => mutations.push(listener), onApiRejection: listener => rejections.push(listener) },
    './toast': { toast: { success: message => notices.push(message) }, toastStore: { clear() {} } },
  }, { setTimeout: () => 1, clearTimeout() {} });
  return { ...exports, calls, notices, mutate: event => mutations.forEach(listener => listener(event)),
    reject: path => rejections.forEach(listener => listener(path)),
    account(uid) { identity = uid; sessions.forEach(listener => listener(uid ? { user: { uid } } : null)); },
  };
}
test('production bridge restores queries, reuses confirmed store/product/order mutations and makes zero follow-up GETs', async () => {
  const h = market(); await h.loadMarketQuery('/me', 'alice');
  const store = { id: 'alice', ownerUid: 'alice', name: 'Test store', status: 'active' };
  h.marketCache.set('/seller/store?page=1', 'alice', { store, products: [], nextCursor: null });
  const publicStorePath = '/stores/alice?page=1&view=compact&sort=newest&includeStoreVerification=1';
  h.marketCache.set(publicStorePath, 'public', {
    store: { ...store, phone: '+27821234567', whatsappAvailable: true },
    products: [],
  });
  h.marketCache.set('/seller/orders', 'alice', { orders: [] });
  h.mutate({ path: '/application', data: { id: 'alice', ownerUid: 'alice', status: 'pending' } });
  assert.equal(h.marketCache.get('/me', 'alice').data.application.status, 'pending');
  h.mutate({ path: '/seller/store', data: { ...store, name: 'Updated store' } });
  assert.equal(h.marketCache.get('/me', 'alice').data.store.name, 'Updated store');
  assert.equal(h.marketCache.get(publicStorePath, 'public').data.store.phone, '+27821234567');
  assert.equal(h.marketCache.get(publicStorePath, 'public').data.store.whatsappAvailable, true);
  h.mutate({ path: '/seller/products', data: { id: 'p', storeId: 'alice', published: true } });
  assert.equal(h.marketCache.get('/seller/store?page=1', 'alice').data.products.length, 1);
  const inventoryTime = h.marketCache.get('/seller/store?page=1', 'alice').updatedAt;
  h.marketCache.set('/products', 'public', { products: [] });
  const catalogueTime = h.marketCache.get('/products', 'public').updatedAt;
  h.mutate({ path: '/seller/orders/o', data: { id: 'o', sellerUid: 'alice', buyerUid: 'buyer', storeId: 'alice', status: 'ready' } });
  assert.equal(h.marketCache.get('/seller/orders', 'alice').data.orders[0].status, 'ready');
  assert.equal(h.marketCache.get('/seller/store?page=1', 'alice').updatedAt, inventoryTime);
  assert.equal(h.marketCache.get('/products', 'public').updatedAt, catalogueTime, 'ready updates do not invalidate unchanged stock');
  assert.equal(h.calls.length, 1); assert.equal(h.notices.length, 4);
});

test('a stock-changing order invalidates stock snapshots while leaving saved seller status intact', async () => {
  const h = market(); await h.loadMarketQuery('/me', 'alice');
  h.marketCache.set('/products', 'public', { products: [] });
  h.marketCache.set('/seller/store?page=1', 'alice', { store: { id: 'alice' }, products: [], nextCursor: null });
  const statusTime = h.marketCache.get('/me', 'alice').updatedAt;
  h.mutate({ path: '/seller/orders/o', data: { id: 'o', sellerUid: 'alice', buyerUid: 'buyer', storeId: 'alice', status: 'cancelled' } });
  assert.equal(h.marketCache.get('/products', 'public').updatedAt, null);
  assert.equal(h.marketCache.get('/seller/store?page=1', 'alice').updatedAt, null);
  assert.equal(h.marketCache.get('/me', 'alice').updatedAt, statusTime);
  assert.equal(h.calls.length, 1);
});

test('opening owned products reuses complete inventory with its original age; explicit refresh still reaches the server', async () => {
  const h = market(); await h.loadMarketQuery('/me', 'alice');
  const store = { id: 'alice', ownerUid: 'alice', status: 'active' };
  const product = { id: 'p', storeId: 'alice', ownerUid: 'alice', photos: ['one', 'two'], description: 'Complete description' };
  h.marketCache.set('/seller/store?page=1', 'alice', { store, products: [product], nextCursor: null });
  const fetchedAt = h.marketCache.get('/seller/store?page=1', 'alice').updatedAt;
  await Promise.all([h.loadMarketQuery('/seller/products/p', 'alice'), h.loadMarketQuery('/seller/products/p', 'alice')]);
  const detail = h.marketCache.get('/seller/products/p', 'alice');
  assert.equal(detail.updatedAt, fetchedAt);
  assert.equal(detail.data.product.photos.length, 2);
  assert.equal(detail.data.product.description, product.description);
  assert.equal(h.calls.length, 1, 'inventory navigation does not need a second read');
  await h.loadMarketQuery('/seller/products/p', 'alice', true);
  assert.equal(h.calls.length, 2, 'manual/conflict reload bypasses reuse');
});

test('touching a product while scrolling makes zero requests; a completed tap and screen share one read', async () => {
  const h = market(), navigations = [];
  const { ProductCard } = loadTs('src/components/market/ProductCard.tsx', {
    'react/jsx-runtime': jsx, 'react-native': { Text: 'Text', View: 'View', StyleSheet: { create: styles => styles } },
    '@/components/ui/DebouncedPressable': { DebouncedPressable: 'Pressable' },
    'expo-router': { router: { navigate: target => navigations.push(target) } },
    '@expo/vector-icons': { Ionicons: 'Icon' }, './MarketImage': { MarketImage: 'Image' },
    '@/constants/market-theme': { palette: {}, ui: {}, money: String },
    '@/lib/market-cache': h,
  });
  function elements(node) {
    if (!node || typeof node !== 'object') return [];
    if (Array.isArray(node)) return node.flatMap(elements);
    return [node, ...elements(node.props?.children)];
  }
  const card = ProductCard({ product: { id: 'p', name: 'Coffee', photos: [], category: 'Pantry' } });
  const target = elements(card).find(node => node.props?.accessibilityLabel === 'View Coffee');
  target.props.onPressIn?.(); await tick();
  assert.equal(h.calls.length, 0); assert.equal(navigations.length, 0);
  target.props.onPress();
  await h.loadMarketQuery('/products/p', 'public');
  assert.deepEqual(h.calls, ['/products/p']); assert.equal(navigations.length, 1);
});

test('old inventory is reusable without a read, but known invalidation forces current details', async () => {
  const h = market(); await h.activateMarketCache('alice');
  const data = { store: { id: 'alice', ownerUid: 'alice', status: 'active' },
    products: [{ id: 'p', ownerUid: 'alice', storeId: 'alice' }] };
  h.marketCache.restore([{ path: '/seller/store?page=1', scope: 'alice', data, updatedAt: Date.now() - 2 * 24 * 60 * 60_000 }], 'alice');
  await h.loadMarketQuery('/seller/products/p', 'alice');
  assert.equal(h.calls.length, 0);
  assert.equal(h.marketCache.get('/seller/products/p', 'alice').data.product.id, 'p');
  h.marketCache.set('/seller/store?page=1', 'alice', data);
  h.marketCache.invalidate(path => path === '/seller/store?page=1');
  h.marketCache.invalidate(path => path === '/seller/products/p', true);
  await h.loadMarketQuery('/seller/products/p', 'alice');
  assert.deepEqual(h.calls, ['/seller/products/p']);
});

test('confirmed price edits, drafts and deletion keep loaded lists usable without follow-up reads', async () => {
  const h = market(); await h.activateMarketCache('alice');
  const product = { id: 'p', ownerUid: 'alice', storeId: 'alice', name: 'Coffee', description: 'Roasted coffee beans', category: 'Pantry', published: true, priceCents: 1000 };
  const path = '/products?page=1';
  h.marketCache.set(path, 'public', { products: [product], nextCursor: 'later' });
  h.marketCache.set('/products?category=Accessories&page=1', 'public', { products: [] });
  h.marketCache.set('/stores/other?page=1', 'public', { products: [] });
  const fetchedAt = h.marketCache.get(path, 'public').updatedAt;
  h.mutate({ path: '/seller/products/p', data: { ...product, priceCents: 1200 } });
  await h.loadMarketQuery(path, 'public');
  assert.equal(h.marketCache.get(path, 'public').data.products[0].priceCents, 1200);
  h.mutate({ path: '/seller/products/p/draft', data: { ...product, published: false } });
  await h.loadMarketQuery(path, 'public');
  assert.equal(h.marketCache.get(path, 'public').data.products.length, 0);
  assert.equal(h.marketCache.get(path, 'public').data.nextCursor, 'later');
  h.mutate({ path: '/seller/products/p', data: { id: 'p', storeId: 'alice', ownerUid: 'alice', deleted: true } });
  for (const entry of h.marketCache.export('public')) await h.loadMarketQuery(entry.path, 'public');
  assert.equal(h.marketCache.get(path, 'public').updatedAt, fetchedAt, 'partial edits never renew unrelated list freshness');
  assert.equal(h.calls.length, 0);
});

test('publishing refreshes matching search/category lists while preserving unrelated lists and removing old matches', async () => {
  const h = market(); await h.activateMarketCache('alice');
  const product = { id: 'p', ownerUid: 'alice', storeId: 'alice', name: 'Coffee', description: 'Roasted beans', category: 'Pantry', published: true };
  const matching = '/products?category=Pantry&page=1&q=coffee';
  const unrelated = '/products?category=Accessories&page=1';
  const oldMatch = '/products?page=1&q=tea';
  h.marketCache.set(matching, 'public', { products: [] });
  h.marketCache.set(unrelated, 'public', { products: [] });
  h.marketCache.set(oldMatch, 'public', { products: [{ ...product, name: 'Tea' }] });
  h.mutate({ path: '/seller/products/p', data: product });
  assert.equal(h.marketCache.get(matching, 'public').updatedAt, null, 'a newly matching listing changes membership');
  assert.notEqual(h.marketCache.get(unrelated, 'public').updatedAt, null);
  assert.notEqual(h.marketCache.get(oldMatch, 'public').updatedAt, null);
  assert.equal(h.marketCache.get(oldMatch, 'public').data.products.length, 0);
  await h.loadMarketQuery(unrelated, 'public'); await h.loadMarketQuery(oldMatch, 'public');
  assert.equal(h.calls.length, 0);
});

test('draft and delete responses update loaded inventory and remove listings without a follow-up GET', async () => {
  const h = market(); await h.loadMarketQuery('/me', 'alice');
  const product = { id: 'p', ownerUid: 'alice', storeId: 'alice', published: true, stock: 3 };
  const other = { ...product, id: 'other' };
  const store = { id: 'alice' };
  h.marketCache.set('/seller/store?page=1', 'alice', { store, products: [product, other], nextCursor: null });
  h.marketCache.set('/seller/products/p', 'alice', { store, product });
  h.marketCache.set('/products/p', 'public', { store, product });
  h.marketCache.set('/products/other', 'public', { store, product: other });
  h.marketCache.set('/products?page=1', 'public', { products: [product, other] });
  h.mutate({ path: '/seller/products/p/draft', data: { ...product, published: false } });
  assert.equal(h.marketCache.get('/seller/store?page=1', 'alice').data.products.find(item => item.id === 'p').published, false);
  assert.equal(h.marketCache.get('/seller/products/p', 'alice').data.product.stock, 3);
  assert.equal(h.marketCache.get('/products/p', 'public').data, null);
  assert.deepEqual(Array.from(h.marketCache.get('/products?page=1', 'public').data.products, item => item.id), ['other']);
  h.mutate({ path: '/seller/products/p', data: { id: 'p', storeId: 'alice', ownerUid: 'alice', deleted: true, deletedAt: 'now' } });
  assert.deepEqual(Array.from(h.marketCache.get('/seller/store?page=1', 'alice').data.products, item => item.id), ['other']);
  assert.equal(h.marketCache.get('/seller/products/p', 'alice').data, null);
  assert.equal(h.marketCache.get('/products/other', 'public').data.product.id, 'other');
  assert.equal(h.calls.length, 1);
  assert.deepEqual(h.notices, ['Product moved to drafts.', 'Product deleted.']);
});
test('the production bridge refuses old-account reads and rejects old-account writes after switching', async () => {
  const h = market(); await h.loadMarketQuery('/me', 'alice');
  h.account('bob'); await tick(); await h.loadMarketQuery('/me', 'alice');
  assert.equal(h.calls.length, 1); assert.equal(h.marketCache.get('/me', 'alice').data, null);
  await h.loadMarketQuery('/me', 'bob'); assert.equal(h.calls.length, 2);
  h.account(null); assert.equal(h.marketCache.get('/me', 'bob').data, null);
});
test('a seller mutation rejected for permissions clears private inventory and invalidates status without a GET loop', async () => {
  const h = market(); await h.loadMarketQuery('/me', 'alice');
  h.marketCache.set('/seller/store?page=1', 'alice', { store: { id: 'alice' }, products: [], nextCursor: null });
  h.reject('/seller/photos');
  assert.equal(h.marketCache.get('/seller/store?page=1', 'alice').data, null);
  assert.equal(h.marketCache.get('/me', 'alice').updatedAt, null);
  assert.equal(h.calls.length, 1);
});

function sessionHarness() {
  const disk = new Map(); let refresh = async () => { throw new Error('Offline'); }, online;
  const session = loadTs('src/lib/session.ts', {
    'expo-secure-store': { setItemAsync: async (key, value) => { disk.set(key, value); }, getItemAsync: async key => disk.get(key), deleteItemAsync: async key => { disk.delete(key); } },
    'expo-auth-session': { refreshAsync: (...args) => refresh(...args) },
    './config': { API_BASE: 'https://test.invalid', CLIENT_ID: 'test-client' },
    './network-state': { networkState: { record: value => { online = value; } } },
  });
  return { session, disk, online: () => online, respond: fn => { refresh = fn; } };
}
test('offline token refresh retains the encrypted account; a revoked refresh token clears it', async () => {
  const h = sessionHarness(), initial = { token: 'test-token', refreshToken: 'test-refresh', expiresAt: 1, user: { uid: 'alice' } };
  await h.session.saveSession(initial);
  await assert.rejects(h.session.accessToken(), /connection/);
  assert.equal(h.session.currentSession().user.uid, 'alice'); assert.equal(h.disk.size, 1); assert.equal(h.online(), false);
  h.respond(async () => { throw Object.assign(new Error('Revoked'), { code: 'invalid_grant' }); });
  assert.equal(await h.session.accessToken(), null); assert.equal(h.session.currentSession(), null); assert.equal(h.disk.size, 0);
});
test('token refreshes are deduplicated and do not reset account cache revision', async () => {
  const h = sessionHarness(); let calls = 0;
  await h.session.saveSession({ token: 'old', refreshToken: 'test', expiresAt: 1, user: { uid: 'alice' } });
  const revision = h.session.sessionRevision();
  h.respond(async () => { calls++; return { accessToken: 'new', expiresIn: 3600 }; });
  await Promise.all([h.session.accessToken(), h.session.accessToken()]);
  assert.equal(calls, 1); assert.equal(h.session.sessionRevision(), revision);
  await h.session.saveSession(null); await h.session.saveSession({ token: 'new', expiresAt: 1, user: { uid: 'alice' } });
  assert.ok(h.session.sessionRevision() > revision);
});
