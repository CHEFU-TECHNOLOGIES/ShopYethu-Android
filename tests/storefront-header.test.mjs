import assert from 'node:assert/strict';
import { test } from 'node:test';
import * as jsx from 'react/jsx-runtime';
import { loadTs } from './load-ts.mjs';

test('WhatsApp badge opens a chat using the storefront phone number', async () => {
  let openedUrl = '';
  let openURL = async url => { openedUrl = url; };
  const errors = [];
  const { StorefrontHeader } = loadTs('src/components/market/StorefrontHeader.tsx', {
    'react/jsx-runtime': jsx,
    'react-native': {
      Linking: { openURL: url => openURL(url) },
      Pressable: 'Pressable',
      StyleSheet: { create: styles => styles },
      Text: 'Text',
      View: 'View',
    },
    '@expo/vector-icons': { FontAwesome: 'Icon', MaterialIcons: 'Icon' },
    '@/components/market/OperatingAreaLabel': { OperatingAreaLabel: 'Area' },
    '@/components/market/CatalogSortSelector': { CatalogSortSelector: 'Sort' },
    '@/constants/market-theme': { palette: { brand: '', paper: '' }, ui: {} },
    '@/lib/toast': { toast: { error: message => errors.push(message) } },
  });
  const tree = StorefrontHeader({
    store: { id: 'store', name: 'Test Store', area: 'Cape Town', phone: '+27821234567', whatsappAvailable: true },
    sort: 'newest',
    onSortChange() {},
  });
  function nodes(node) {
    if (!node || typeof node !== 'object') return [];
    if (Array.isArray(node)) return node.flatMap(nodes);
    return [node, ...nodes(node.props?.children)];
  }
  const badge = nodes(tree).find(node => node.type === 'Pressable');
  assert.ok(badge);
  badge.props.onPress();
  await new Promise(setImmediate);
  assert.equal(openedUrl, 'https://wa.me/27821234567');

  openURL = async () => { throw new Error('No app available'); };
  badge.props.onPress();
  await new Promise(setImmediate);
  assert.deepEqual(errors, ['Could not open WhatsApp. Please try again.']);
});
