import assert from 'node:assert/strict';
import { test } from 'node:test';
import * as jsx from 'react/jsx-runtime';
import { loadTs } from './load-ts.mjs';

const tick = () => new Promise(setImmediate);
function nodes(node) {
  if (!node || typeof node !== 'object') return [];
  if (Array.isArray(node)) return node.flatMap(nodes);
  return [node, ...nodes(node.props?.children)];
}

test('seller order status updates immediately and rolls back on rejection', async () => {
  const cells = [];
  let cursor = 0, reject;
  let data = {
    orders: [{
      id: 'order-1', reference: 'SY-1', status: 'placed', buyerUid: 'buyer',
      sellerUid: 'seller', items: [], history: [],
    }],
  };
  const { default: SellerOrderDetails } = loadTs('src/app/selling/order/[id].tsx', {
    react: {
      useRef(initial) { return cells[cursor++] ||= { current: initial }; },
      useState(initial) {
        const index = cursor++;
        if (!(index in cells)) cells[index] = initial;
        return [cells[index], value => { cells[index] = value; }];
      },
    },
    'react/jsx-runtime': jsx,
    'react-native': { Text: 'Text' },
    'expo-router': { useLocalSearchParams: () => ({ id: 'order-1' }) },
    '@/components/market/OrderCard': { OrderCard: 'OrderCard' },
    '@/components/market/Page': { Page: 'Page' },
    '@/components/market/Primitives': { ResourceState: 'ResourceState', SignInNotice: 'SignInNotice' },
    '@/hooks/use-resource': { useResource: () => ({
      data, error: '', loading: false, refresh() {},
      mutate(update) { data = update(data); },
    }) },
    '@/lib/api': { api: () => new Promise((_resolve, rejectRequest) => { reject = rejectRequest; }) },
    '@/lib/auth': { useAuth: () => ({ session: { user: { uid: 'seller' } } }) },
    '@/lib/toast': { toast: { error() {} } },
    '@/constants/market-theme': { ui: {} },
  });
  const render = () => { cursor = 0; return SellerOrderDetails(); };
  const card = () => nodes(render()).find(node => node.type === 'OrderCard');
  card().props.update('accepted');
  assert.equal(data.orders[0].status, 'accepted');
  assert.equal(card().props.loadingAction, 'status');
  reject(new Error('Order update rejected.'));
  await tick();
  assert.equal(data.orders[0].status, 'placed');
  assert.ok(nodes(render()).some(node => node.props?.accessibilityRole === 'alert'));
});

test('report submission shows an unconfirmed pending state and restores the form on rejection', async () => {
  const cells = [];
  let cursor = 0, reject;
  const { default: ReportScreen } = loadTs('src/app/report.tsx', {
    react: {
      useRef(initial) { return cells[cursor++] ||= { current: initial }; },
      useState(initial) {
        const index = cursor++;
        if (!(index in cells)) cells[index] = initial;
        return [cells[index], value => { cells[index] = typeof value === 'function' ? value(cells[index]) : value; }];
      },
    },
    'react/jsx-runtime': jsx,
    'react-native': { Text: 'Text', View: 'View' },
    'expo-router': { useLocalSearchParams: () => ({ productId: 'product-1' }) },
    '@/components/market/Primitives': { Button: 'Button', Field: 'Field', Page: 'Page', SignInNotice: 'SignInNotice' },
    '@/lib/auth': { useAuth: () => ({ session: { user: { uid: 'buyer' } } }) },
    '@/lib/api': { api: () => new Promise((_resolve, rejectRequest) => { reject = rejectRequest; }) },
    '@/constants/market-theme': { ui: {} },
    '@/lib/toast': { toast: { error() {} } },
  });
  const render = () => { cursor = 0; return ReportScreen(); };
  let elements = nodes(render());
  elements.find(node => node.type === 'Field').props.onChangeText('This listing is inaccurate.');
  elements = nodes(render());
  elements.find(node => node.type === 'Button' && node.props.title === 'Send report').props.onPress();
  elements = nodes(render());
  assert.ok(elements.some(node => node.type === 'Text' && node.props.children === 'Sending your report'));
  assert.ok(elements.some(node => typeof node.props?.children === 'string' && node.props.children.includes('not confirmed yet')));
  reject(new Error('Report was rejected.'));
  await tick();
  elements = nodes(render());
  assert.ok(elements.some(node => node.type === 'Button' && node.props.title === 'Send report'));
  assert.ok(elements.some(node => node.props?.accessibilityRole === 'alert' && node.props.children === 'Report was rejected.'));
});
