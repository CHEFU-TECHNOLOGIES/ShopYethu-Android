import assert from 'node:assert/strict';
import { test } from 'node:test';
import * as jsx from 'react/jsx-runtime';
import { loadTs } from './load-ts.mjs';
const tick = () => new Promise(setImmediate);
const product = {
  id: 'test-product', ownerUid: 'seller', name: 'Test product',
  description: 'A valid product description for publication.',
  category: 'Other', priceCents: 2500, stock: 8,
  photos: ['https://example.test/product.jpg'], fulfilment: ['collection'],
  published: true, updatedAt: '2026-01-01T00:00:00.000Z',
};
function nodes(node) {
  if (!node || typeof node !== 'object') return [];
  if (Array.isArray(node)) return node.flatMap(nodes);
  return [node, ...nodes(node.props?.children)];
}
function setup(published = true) {
  const cells = [], calls = [], optimistic = [], settled = [], errors = []; let cursor = 0, closed = 0, respond = async () => ({});
  const react = {
    useState(initial) {
      const index = cursor++;
      if (!(index in cells)) cells[index] = initial;
      return [cells[index], value => { cells[index] = typeof value === 'function' ? value(cells[index]) : value; }];
    },
    useRef(initial) { const index = cursor++; return cells[index] ||= { current: initial }; },
  };
  const productForm = loadTs('src/lib/product-form.ts', {}, { URL });
  const publishProduct = loadTs('src/lib/publish-product.ts', {
    '@/lib/api': { api: async (path, options) => { calls.push({ path, ...options }); return respond(); } },
    '@/lib/product-form': productForm,
  }, { URL });
  const productActionsHook = loadTs('src/hooks/use-product-actions.ts', {
    react,
    'expo-router': { router: { navigate() {} } },
    'expo-crypto': { randomUUID: () => 'publish-attempt-key-123456' },
    '@/lib/api': { api: async (path, options) => { calls.push({ path, ...options }); return respond(); } },
    '@/lib/publish-product': publishProduct,
    '@/lib/toast': { toast: { error: message => errors.push(message) } },
  });
  const { ProductActions } = loadTs('src/components/selling/ProductActions.tsx', {
    react,
    'react/jsx-runtime': jsx,
    'react-native': { Modal: 'Modal', ScrollView: 'ScrollView', View: 'View', Text: 'Text', StyleSheet: { create: value => value } },
    'react-native-safe-area-context': { useSafeAreaInsets: () => ({ bottom: 0 }) },
    '@expo/vector-icons': { Ionicons: 'Icon' },
    '@/components/ui/DebouncedPressable': { DebouncedPressable: 'Pressable' },
    '@/components/market/Button': { Button: 'Button' },
    '@/constants/market-theme': { palette: {}, ui: {} },
    '@/hooks/use-product-actions': productActionsHook,
  });
  const render = () => { cursor = 0; return ProductActions({
    product: { ...product, published },
    onClose: () => { closed++; },
    onOptimistic: (action, item) => optimistic.push({ action, item }),
    onSettled: id => settled.push(id),
  }); };
  const elements = () => nodes(render());
  return { render, elements, calls, optimistic, settled, errors, closed: () => closed, respond: callback => { respond = callback; },
    button: title => elements().find(node => node.type === 'Button' && node.props.title === title),
    action: title => elements().find(node => node.type === 'Pressable' && nodes(node.props.children).some(child => child.type === 'Text' && child.props.children === title)),
  };
}

test('deletion requires confirmation, closes immediately and blocks duplicate actions', async () => {
  const cancelled = setup();
  cancelled.action('Delete product').props.onPress();
  cancelled.render().props.onRequestClose();
  assert.equal(cancelled.closed(), 1);
  assert.equal(cancelled.calls.length, 0, 'closing confirmation must not delete');
  const h = setup(); let finish;
  h.respond(() => new Promise(resolve => { finish = resolve; }));
  h.action('Delete product').props.onPress();
  assert.equal(h.calls.length, 0, 'opening confirmation must not delete');
  const confirm = h.button('Delete product');
  confirm.props.onPress(); confirm.props.onPress();
  assert.equal(h.calls.length, 1);
  assert.equal(h.closed(), 1, 'close the action sheet while the request is pending');
  assert.equal(h.optimistic[0].action, 'delete');
  assert.equal(h.calls[0].method, 'DELETE');
  assert.equal(h.calls[0].path, '/seller/products/test-product');
  assert.equal(h.button('Deleting product…').props.loading, true);
  h.button('Deleting product…').props.onPress();
  assert.equal(h.calls.length, 1);
  h.render().props.onRequestClose();
  assert.equal(h.closed(), 1);
  finish({ deleted: true }); await tick();
  assert.equal(h.closed(), 1, 'do not close again after the request finishes');
  assert.deepEqual(h.settled, ['test-product']);
});

test('draft sends the required empty JSON body and restores the product after rejection', async () => {
  const h = setup(); h.respond(async () => { throw new Error('Selling is suspended.'); });
  h.action('Move to draft').props.onPress();
  assert.equal(h.closed(), 1, 'close before waiting for the server');
  await tick();
  assert.equal(h.calls[0].path, '/seller/products/test-product/draft');
  assert.equal(h.calls[0].method, 'PUT');
  assert.equal(h.calls[0].body, '{}', 'stale screen fields must not overwrite stock or edits');
  assert.deepEqual(h.optimistic.map(change => change.action), ['draft']);
  assert.deepEqual(h.settled, ['test-product']);
  assert.match(h.errors[0], /Selling is suspended.*product was restored/);
  assert.equal(setup(false).action('Move to draft'), undefined, 'an existing draft does not offer Move to draft');
  assert.ok(setup(false).action('Publish product'), 'drafts offer a publish action');
});

test('inventory card opens product details while long press keeps the management actions', () => {
  const routes = [], actions = [], vibrations = [];
  const { InventoryRow } = loadTs('src/components/selling/InventoryRow.tsx', {
    react: { useState: initial => [initial, () => {}] },
    'react/jsx-runtime': jsx,
    'react-native': { Text: 'Text', Vibration: { vibrate: duration => vibrations.push(duration) }, View: 'View' },
    '@/components/ui/DebouncedPressable': { DebouncedPressable: 'Pressable' },
    '@/components/market/MarketImage': { MarketImage: 'MarketImage' },
    '@expo/vector-icons': { Ionicons: 'Icon' },
    'expo-router': { router: { navigate: route => routes.push(route) } },
    '@/constants/market-theme': { money: value => String(value), palette: {}, ui: {} },
    '@/constants/seller-styles': { sellerStyles: {} },
  });
  const item = { ...product, name: 'Test product', stock: 2, priceCents: 500, photos: [] };
  const tree = InventoryRow({ product: item, onActions: selected => actions.push(selected) });
  const card = nodes(tree).find(node => node.props?.accessibilityLabel?.startsWith('View '));
  assert.ok(card);
  assert.match(card.props.accessibilityHint, /view product details/);
  card.props.onPress();
  assert.equal(routes.length, 1);
  assert.equal(routes[0].pathname, '/product/[id]');
  assert.equal(routes[0].params.id, item.id);
  card.props.onLongPress();
  assert.deepEqual(vibrations, [70]);
  assert.deepEqual(actions, [item]);
});

test('tapping a draft card opens its manage product actions', () => {
  const routes = [], actions = [];
  const { InventoryRow } = loadTs('src/components/selling/InventoryRow.tsx', {
    react: { useState: initial => [initial, () => {}] },
    'react/jsx-runtime': jsx,
    'react-native': { Text: 'Text', Vibration: { vibrate() {} }, View: 'View' },
    '@/components/ui/DebouncedPressable': { DebouncedPressable: 'Pressable' },
    '@/components/market/MarketImage': { MarketImage: 'MarketImage' },
    '@expo/vector-icons': { Ionicons: 'Icon' },
    'expo-router': { router: { navigate: route => routes.push(route) } },
    '@/constants/market-theme': { money: value => String(value), palette: {}, ui: {} },
    '@/constants/seller-styles': { sellerStyles: {} },
  });
  const item = { ...product, published: false };
  const tree = InventoryRow({ product: item, onActions: selected => actions.push(selected) });
  const card = nodes(tree).find(node => node.props?.accessibilityLabel?.startsWith('Manage '));
  assert.ok(card);
  assert.match(card.props.accessibilityHint, /manage this draft/);
  card.props.onPress();
  assert.equal(routes.length, 0);
  assert.deepEqual(actions, [item]);
});

test('draft publish updates the inventory optimistically before the request settles', async () => {
  const h = setup(false); let finish;
  h.respond(() => new Promise(resolve => { finish = resolve; }));
  h.action('Publish product').props.onPress();
  assert.equal(h.optimistic[0].action, 'publish');
  assert.equal(h.closed(), 1, 'close while the publish request is pending');
  assert.equal(h.calls[0].path, '/seller/products/test-product');
  assert.equal(h.calls[0].method, 'PUT');
  assert.equal(JSON.parse(h.calls[0].body).published, true);
  assert.equal(h.action('Publishing…').props.accessibilityState.busy, true);
  finish({ ...product, published: true });
  await tick();
  assert.equal(h.closed(), 1);
});

