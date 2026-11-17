import assert from 'node:assert/strict';
import { test } from 'node:test';
import { loadTs } from './load-ts.mjs';

function setup() {
  let inventory = {
    store: { id: 'seller', ownerUid: 'seller', status: 'active' },
    products: [{ id: 'p1' }, { id: 'p2' }],
    nextCursor: 'cursor-1',
  };
  let requested;
  let beforeResponse = async () => {};
  let page = { data: { products: [{ id: 'p2' }, { id: 'p3' }], nextCursor: null }, error: '' };
  const resource = { data: inventory };
  const hook = loadTs('src/hooks/use-seller-inventory.ts', {
    react: {
      useRef: current => ({ current }),
      useState: initial => [initial, () => {}],
    },
    '@/lib/auth': { useAuth: () => ({ session: { user: { uid: 'seller' } } }) },
    '@/lib/marketplace-paths': { SELLER_INVENTORY_PATH: '/seller/store?page=1' },
    '@/lib/market-cache': {
      loadMarketQuery: async path => { requested = path; await beforeResponse(); },
      marketCache: {
        get: () => page,
        set: (_path, _uid, update) => { resource.data = update(inventory); inventory = resource.data; },
      },
    },
    '@/lib/query-policy': { canonicalPath: path => path },
    '@/lib/toast': { toast: { error() {} } },
    './use-resource': {
      useResource: path => {
        assert.equal(path, '/seller/store?page=1');
        return resource;
      },
    },
  });
  return {
    more: hook.useSellerInventory().more,
    products: () => inventory.products,
    nextCursor: () => inventory.nextCursor,
    requested: () => requested,
    setBeforeResponse(callback) { beforeResponse = callback; },
    setCursor(value) { inventory = { ...inventory, nextCursor: value }; resource.data = inventory; },
  };
}

test('seller inventory requests one cursor page and appends unique products', async () => {
  const h = setup();
  await h.more();
  assert.equal(h.requested(), '/seller/store?page=1&after=cursor-1');
  assert.equal(Array.from(h.products(), product => product.id).join(','), 'p1,p2,p3');
  assert.equal(h.nextCursor(), null);
});

test('a late page cannot append after inventory has refreshed to a different cursor', async () => {
  const h = setup();
  let finish;
  h.setBeforeResponse(() => new Promise(resolve => { finish = resolve; }));
  const pending = h.more();
  await new Promise(setImmediate);
  h.setCursor('cursor-2');
  finish();
  await pending;
  assert.equal(Array.from(h.products(), product => product.id).join(','), 'p1,p2');
  assert.equal(h.nextCursor(), 'cursor-2');
});

test('legacy seller inventory responses without a cursor are rejected', () => {
  const { hasSellerInventoryPageShape } = loadTs('src/lib/marketplace-paths.ts');
  assert.equal(hasSellerInventoryPageShape({ products: [] }), false);
  assert.equal(hasSellerInventoryPageShape({ products: [], nextCursor: null }), true);
  assert.equal(hasSellerInventoryPageShape({ products: [], nextCursor: '' }), false);
});
