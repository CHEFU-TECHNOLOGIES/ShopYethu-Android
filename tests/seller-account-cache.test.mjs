import assert from 'node:assert/strict';
import { test } from 'node:test';
import * as jsx from 'react/jsx-runtime';
import { loadTs } from './load-ts.mjs';
const uid = 'cache-test-user';
const application = { id: uid, ownerUid: uid, businessName: 'Test business', status: 'pending' };
const store = { id: uid, ownerUid: uid, name: 'Test store', status: 'active' };
const load = (file, dependencies) => loadTs(`src/${file}`, dependencies);
const { readSellerAccount } = load('lib/seller-account-cache.ts', {});
test('malformed and wrong-owner seller status is rejected', () => {
  assert.equal(readSellerAccount({ application, store }, uid).store, store);
  for (const value of [null, {}, { application: null }, { application: { ...application, ownerUid: 'other' }, store: null }]) {
    assert.throws(() => readSellerAccount(value, uid), /Invalid seller status/);
  }
});
test('seller section keeps My Store visible during refresh and an offline error', () => {
  const { SellerAccountSection } = load('components/account/SellerAccountSection.tsx', {
    'react/jsx-runtime': jsx, 'react-native': { ActivityIndicator: 'Spinner', Text: 'Text', View: 'View' }, 'expo-router': { router: {} },
    './AccountMenu': { AccountSection: 'Section', AccountRow: 'Row' },
    './SellerAccountSkeleton': { SellerAccountSkeleton: 'SellerAccountSkeleton' },
    '@/constants/account-styles': { account: {} },
    '@/constants/market-theme': {
      palette: {},
      statusLabel: value => value === 'pending' ? 'Pending review' : value,
    },
  });
  function nodes(node) {
    if (!node || typeof node !== 'object') return [];
    if (Array.isArray(node)) return node.flatMap(nodes);
    return [node, ...nodes(node.props?.children)];
  }
  for (const [loading, error] of [[true, ''], [false, 'Offline']]) {
    const tree = SellerAccountSection({ data: { application, store }, loading, error, onRetry() {} });
    assert.ok(nodes(tree).some(node => node.type === 'Row' && node.props.title === 'My Store'));
    assert.equal(nodes(tree).some(node => node.type === 'Spinner'), false, 'background updates keep cached status quiet');
    assert.equal(nodes(tree).some(node => node.props?.children === 'Loading seller status…'), false);
  }
  const manual = SellerAccountSection({ data: { application, store }, loading: true, refreshing: true, error: '', onRetry() {} });
  assert.ok(nodes(manual).some(node => node.type === 'Spinner'), 'explicit refresh still shows progress');
  const active = SellerAccountSection({ data: { application: null, store }, loading: false, error: '', onRetry() {} });
  const pending = SellerAccountSection({ data: { application, store: null }, loading: false, error: '', onRetry() {} });
  const activeRow = nodes(active).find(node => node.type === 'Row' && node.props.title === 'My Store');
  const pendingRow = nodes(pending).find(node => node.type === 'Row' && node.props.title === 'Seller application');
  assert.equal(activeRow.props.titleAccessory.props.label, 'Active');
  assert.equal(pendingRow.props.titleAccessory.props.label, 'Pending review');
});
