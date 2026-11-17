import assert from 'node:assert/strict';
import { test } from 'node:test';
import * as jsx from 'react/jsx-runtime';
import { loadTs } from './load-ts.mjs';

const tick = () => new Promise(setImmediate);
const { createQueryCache } = loadTs('src/lib/query-cache.ts');
const { publicQuery } = loadTs('src/lib/query-policy.ts');

function setup(path = '/me') {
  let now = 1000, calls = 0, cursor = 0, focus, active = false, stop;
  let uid = 'alice', respond = async () => ({ application: null, store: null });
  const cells = [], notices = [];
  const marketCache = createQueryCache((...args) => { calls++; return respond(...args); }, { now: () => now, wait: async () => {} });
  const { useResource } = loadTs('src/hooks/use-resource.ts', {
    react: {
      useCallback: callback => callback,
      useState(initial) {
        const index = cursor++;
        if (!(index in cells)) cells[index] = initial;
        return [cells[index], update => { cells[index] = typeof update === 'function' ? update(cells[index]) : update; }];
      },
      useSyncExternalStore: (_subscribe, snapshot) => snapshot(),
    },
    'expo-router': { useFocusEffect: callback => { focus = callback; } },
    '@/lib/auth': { useAuth: () => ({ ready: true, session: uid ? { user: { uid } } : null }) },
    '@/lib/query-policy': loadTs('src/lib/query-policy.ts'),
    '@/lib/market-cache': {
      marketCache, queryScope: (path, user) => publicQuery(path) ? 'public' : user || 'guest',
      loadMarketQuery: (...args) => marketCache.load(...args),
    },
    '@/lib/toast': { toast: { error: message => notices.push(message) } },
  });
  function render() { cursor = 0; return useResource(path); }
  return {
    render, cache: marketCache, calls: () => calls, notices,
    async visit() {
      render();
      if (!active) { stop = focus(); active = true; }
      await tick();
      return render();
    },
    leave() { stop?.(); active = false; },
    advance: amount => { now += amount; }, respond: callback => { respond = callback; },
    account: next => { uid = next; },
  };
}

test('account, application, orders, catalogue, store and inventory visits across one hundred days reuse saved data', async () => {
  for (const path of ['/me', '/orders', '/seller/orders', '/products?page=1', '/products/p', '/stores/s', '/seller/store', '/config']) {
  const h = setup(path);
  try {
    await h.visit();
    for (let visit = 0; visit < 20; visit++) {
      h.leave(); h.advance(5 * 24 * 60 * 60 * 1000);
      const state = await h.visit();
      h.cache.refreshActive(); await tick();
      assert.ok(state.data);
      assert.equal(state.loading, false);
      assert.equal(state.refreshing, false);
    }
    assert.equal(h.calls(), 1);
  } finally { h.leave(); }
  }
});

test('opening application status reuses it; Check status explicitly refreshes and reveals approval', async () => {
  const h = setup();
  try {
    await h.visit(); h.leave(); h.advance(90 * 24 * 60 * 60_000);
    await h.visit(); assert.equal(h.calls(), 1);
    let finish;
    h.respond(() => new Promise(resolve => { finish = resolve; }));
    h.render().refresh(); await tick();
    const state = h.render();
    h.cache.refreshActive(); await tick();
    assert.equal(h.calls(), 2);
    assert.ok(state.data);
    assert.equal(state.loading, true);
    assert.equal(state.refreshing, true);
    finish({ application: null, store: { status: 'active' } }); await tick();
    assert.equal(h.render().data.store.status, 'active');
    assert.equal(h.render().loading, false);
    h.leave(); await h.visit(); assert.equal(h.calls(), 2);
  } finally { h.leave(); }
});

test('manual refresh displays progress immediately, deduplicates taps and keeps cached status on failure', async () => {
  const h = setup();
  try {
    await h.visit();
    let fail;
    h.respond(() => new Promise((_resolve, reject) => { fail = reject; }));
    h.render().refresh(); h.render().refresh();
    assert.equal(h.render().refreshing, true);
    await tick(); assert.equal(h.calls(), 2);
    fail(Object.assign(new Error('Please try again.'), { status: 400 })); await tick();
    assert.equal(h.render().refreshing, false);
    assert.ok(h.render().data);
    assert.ok(h.notices.includes('Please try again.'));
    h.leave(); h.advance(90 * 24 * 60 * 60_000); await h.visit();
    h.cache.refreshActive(true); await tick();
    assert.equal(h.calls(), 2, 'failed explicit refresh does not cause background or navigation retries while saved data exists');
  } finally { h.leave(); }
});

test('manual-refresh state and cached seller data do not cross accounts', async () => {
  const h = setup();
  try {
    await h.visit();
    let finish;
    h.respond(() => new Promise(resolve => { finish = resolve; }));
    h.render().refresh(); await tick();
    h.account('bob');
    assert.equal(h.render().data, null);
    assert.equal(h.render().refreshing, false);
    finish({ application: null, store: null }); await tick();
    assert.equal(h.render().data, null);
  } finally { h.leave(); }
});

test('the application screen exposes Check status and applies backend approval only after that action', async () => {
  const h = setup();
  h.respond(async () => ({ application: { status: 'pending' }, store: null }));
  const { default: ApplicationScreen } = loadTs('src/app/application.tsx', {
    react: { useState: initial => [initial, () => {}] }, 'react/jsx-runtime': jsx,
    'react-native': { Text: 'Text' },
    '@/components/market/Primitives': { Page: 'Page', Button: 'Button', ResourceState: 'State', SignInNotice: 'Notice' },
    '@/components/application/ApplicationStatus': { ApplicationStatus: 'ApplicationStatus' },
    '@/components/application/ApplicationWizard': { ApplicationWizard: 'Wizard' },
    '@/lib/auth': { useAuth: () => ({ session: { user: { uid: 'alice' } } }) },
    '@/hooks/use-seller-account': { useSellerAccount: () => h.render() },
    '@/lib/seller-account': { recordSellerApplication() {} }, '@/constants/market-theme': { ui: {} },
  });
  function elements(node) {
    if (!node || typeof node !== 'object') return [];
    if (Array.isArray(node)) return node.flatMap(elements);
    return [node, ...elements(node.props?.children)];
  }
  try {
    await h.visit(); h.leave(); h.advance(90 * 24 * 60 * 60_000); await h.visit();
    const screen = ApplicationScreen(), tree = screen.type(screen.props);
    assert.equal(h.calls(), 1);
    const button = elements(tree).find(node => node.type === 'Button' && node.props.title === 'Check status');
    assert.ok(button);
    h.respond(async () => ({ application: { status: 'approved' }, store: { status: 'active' } }));
    button.props.onPress(); await tick();
    assert.equal(h.calls(), 2);
    assert.equal(h.render().data.store.status, 'active');
    const updated = ApplicationScreen(), after = updated.type(updated.props);
    assert.equal(elements(after).find(node => node.type === 'ApplicationStatus').props.application.status, 'approved');
  } finally { h.leave(); }
});

test('offline foregrounding does not probe the backend when data is saved; tapping Retry remains explicit', async () => {
  const listeners = [], cleanup = [];
  let calls = 0, retries = 0;
  const cache = createQueryCache(async () => { calls++; return {}; });
  cache.set('/orders', 'alice', { orders: [] });
  const stop = cache.observe('/orders', 'alice');
  const { MarketplaceSync } = loadTs('src/components/feedback/MarketplaceSync.tsx', {
    react: { useEffect: effect => cleanup.push(effect()), useSyncExternalStore: (_subscribe, get) => get() },
    'react/jsx-runtime': jsx,
    'react-native': { AppState: { addEventListener: (_event, listener) => { listeners.push(listener); return { remove() {} }; } },
      Text: 'Text', StyleSheet: { create: styles => styles }, useColorScheme: () => 'light' },
    '@/components/ui/DebouncedPressable': { DebouncedPressable: 'Pressable' },
    'react-native-safe-area-context': { useSafeAreaInsets: () => ({ bottom: 0 }) },
    '@expo/vector-icons/Feather': 'Icon',
    '@/lib/network-state': { networkState: { subscribe() {}, get: () => false } },
    '@/lib/market-recovery': { retryMarketplaceConnection: async () => { retries++; } },
    '@/lib/market-cache': { marketCache: cache, activateMarketCache: async () => {}, flushMarketCache: async () => {} },
    '@/lib/session': { currentSession: () => ({ user: { uid: 'alice' } }) },
    '@/lib/auth': { useAuth: () => ({ ready: true }) },
  });
  try {
    const banner = MarketplaceSync();
    for (let resume = 0; resume < 20; resume++) listeners.forEach(listener => listener('active'));
    await tick(); assert.equal(calls, 0); assert.equal(retries, 0);
    banner.props.onPress(); await tick(); assert.equal(retries, 1);
  } finally { cleanup.forEach(stop => stop?.()); stop(); }
});
