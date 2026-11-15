import assert from 'node:assert/strict';
import { test } from 'node:test';
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
  h.marketCache.set('/seller/store', 'alice', { store, products: [] });
  h.marketCache.set('/seller/orders', 'alice', { orders: [] });
  h.mutate({ path: '/application', data: { id: 'alice', ownerUid: 'alice', status: 'pending' } });
  assert.equal(h.marketCache.get('/me', 'alice').data.application.status, 'pending');
  h.mutate({ path: '/seller/store', data: { ...store, name: 'Updated store' } });
  assert.equal(h.marketCache.get('/me', 'alice').data.store.name, 'Updated store');
  h.mutate({ path: '/seller/products', data: { id: 'p', storeId: 'alice', published: true } });
  assert.equal(h.marketCache.get('/seller/store', 'alice').data.products.length, 1);
  h.mutate({ path: '/seller/orders/o', data: { id: 'o', sellerUid: 'alice', buyerUid: 'buyer', storeId: 'alice', status: 'ready' } });
  assert.equal(h.marketCache.get('/seller/orders', 'alice').data.orders[0].status, 'ready');
  assert.equal(h.calls.length, 1); assert.equal(h.notices.length, 4);
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
  h.marketCache.set('/seller/store', 'alice', { store: { id: 'alice' }, products: [] });
  h.reject('/seller/photos');
  assert.equal(h.marketCache.get('/seller/store', 'alice').data, null);
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
