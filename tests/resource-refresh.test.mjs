import assert from 'node:assert/strict';
import { test } from 'node:test';
import { loadTs } from './load-ts.mjs';

const tick = () => new Promise(setImmediate);
const { createQueryCache } = loadTs('src/lib/query-cache.ts');

function setup() {
  let now = 1000, calls = 0, cursor = 0, focus, active = false, stop;
  let uid = 'alice', maxStaleMs, respond = async () => ({ application: null, store: null });
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
      marketCache, queryScope: (_path, user) => user || 'guest',
      loadMarketQuery: (...args) => marketCache.load(...args),
    },
    '@/lib/toast': { toast: { error: message => notices.push(message) } },
  });
  function render() { cursor = 0; return useResource('/me', true, maxStaleMs); }
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
    context: value => { maxStaleMs = value; },
  };
}

test('twenty account revisits and foreground events across sixty hours reuse one seller-status GET', async () => {
  const h = setup();
  try {
    await h.visit();
    for (let visit = 0; visit < 20; visit++) {
      h.leave(); h.advance(3 * 60 * 60 * 1000);
      const state = await h.visit();
      h.cache.refreshActive(); await tick();
      assert.ok(state.data);
      assert.equal(state.loading, false);
      assert.equal(state.refreshing, false);
    }
    assert.equal(h.calls(), 1);
  } finally { h.leave(); }
});

test('entering an application or product context checks older permissions once with cached content and no manual indicator', async () => {
  const h = setup();
  try {
    await h.visit(); h.leave(); h.advance(300_000); h.context(60_000);
    let finish;
    h.respond(() => new Promise(resolve => { finish = resolve; }));
    const state = await h.visit();
    h.cache.refreshActive(); await tick();
    assert.equal(h.calls(), 2);
    assert.ok(state.data);
    assert.equal(state.loading, true);
    assert.equal(state.refreshing, false);
    finish({ application: null, store: { status: 'active' } }); await tick();
    assert.equal(h.render().data.store.status, 'active');
    assert.equal(h.render().loading, false);
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
