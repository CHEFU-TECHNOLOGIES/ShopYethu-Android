import assert from 'node:assert/strict';
import { test } from 'node:test';
import * as jsx from 'react/jsx-runtime';
import { loadTs } from './load-ts.mjs';
const tick = () => new Promise(setImmediate);
const product = { id: 'test-product', ownerUid: 'seller', name: 'Test product', published: true };
function nodes(node) {
  if (!node || typeof node !== 'object') return [];
  if (Array.isArray(node)) return node.flatMap(nodes);
  return [node, ...nodes(node.props?.children)];
}
function setup(published = true) {
  const cells = [], calls = [], optimistic = [], settled = []; let cursor = 0, closed = 0, respond = async () => ({});
  const { ProductActions } = loadTs('src/components/selling/ProductActions.tsx', {
    react: {
      useState(initial) {
        const index = cursor++;
        if (!(index in cells)) cells[index] = initial;
        return [cells[index], value => { cells[index] = typeof value === 'function' ? value(cells[index]) : value; }];
      },
      useRef(initial) { const index = cursor++; return cells[index] ||= { current: initial }; },
    },
    'react/jsx-runtime': jsx,
    'react-native': { Modal: 'Modal', ScrollView: 'ScrollView', View: 'View', Text: 'Text', StyleSheet: { create: value => value } },
    'react-native-safe-area-context': { useSafeAreaInsets: () => ({ bottom: 0 }) },
    '@expo/vector-icons': { Ionicons: 'Icon' }, 'expo-router': { router: { navigate() {} } },
    '@/components/ui/DebouncedPressable': { DebouncedPressable: 'Pressable' },
    '@/components/market/Button': { Button: 'Button' },
    '@/constants/market-theme': { palette: {}, ui: {} },
    '@/lib/api': { api: async (path, options) => { calls.push({ path, ...options }); return respond(); } },
  });
  const render = () => { cursor = 0; return ProductActions({
    product: { ...product, published },
    onClose: () => { closed++; },
    onOptimistic: (action, item) => optimistic.push({ action, item }),
    onSettled: id => settled.push(id),
  }); };
  const elements = () => nodes(render());
  return { render, elements, calls, optimistic, settled, closed: () => closed, respond: callback => { respond = callback; },
    button: title => elements().find(node => node.type === 'Button' && node.props.title === title),
    action: title => elements().find(node => node.type === 'Pressable' && nodes(node.props.children).some(child => child.type === 'Text' && child.props.children === title)),
  };
}

test('deletion requires confirmation, hides the product immediately and blocks duplicate actions', async () => {
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
  assert.equal(h.closed(), 0, 'keep the action sheet open while the result is pending');
  assert.equal(h.optimistic[0].action, 'delete');
  assert.equal(h.calls[0].method, 'DELETE');
  assert.equal(h.calls[0].path, '/seller/products/test-product');
  assert.equal(h.button('Deleting product…').props.loading, true);
  h.button('Deleting product…').props.onPress();
  assert.equal(h.calls.length, 1);
  h.render().props.onRequestClose();
  assert.equal(h.closed(), 0);
  finish({ deleted: true }); await tick();
  assert.equal(h.closed(), 1);
  assert.deepEqual(h.settled, ['test-product']);
});

test('draft sends the required empty JSON body and restores the product after rejection', async () => {
  const h = setup(); h.respond(async () => { throw new Error('Selling is suspended.'); });
  h.button('Move to draft').props.onPress(); await tick();
  assert.equal(h.calls[0].path, '/seller/products/test-product/draft');
  assert.equal(h.calls[0].method, 'PUT');
  assert.equal(h.calls[0].body, '{}', 'stale screen fields must not overwrite stock or edits');
  assert.equal(h.closed(), 0);
  assert.deepEqual(h.optimistic.map(change => change.action), ['draft']);
  assert.deepEqual(h.settled, ['test-product']);
  assert.ok(h.elements().some(node => node.props?.accessibilityRole === 'alert' && /Selling is suspended/.test(node.props.children)));
  h.respond(async () => ({})); h.button('Move to draft').props.onPress(); await tick();
  assert.equal(h.closed(), 1);
  assert.equal(setup(false).button('Move to draft'), undefined, 'an existing draft does not offer Move to draft');
});
