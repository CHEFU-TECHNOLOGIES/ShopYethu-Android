import assert from 'node:assert/strict';
import { test } from 'node:test';
import * as jsx from 'react/jsx-runtime';
import { loadTs } from './load-ts.mjs';
const tick = () => new Promise(setImmediate);
function elements(node) {
  if (!node || typeof node !== 'object') return [];
  if (Array.isArray(node)) return node.flatMap(elements);
  return [node, ...elements(node.props?.children)];
}
function setup(nameEditable) {
  const store = { id: 'seller', ownerUid: 'seller', name: 'Approved business name', nameEditable,
    description: 'Original shop description.', area: '', areaPlaceId: 'cape-town' };
  let resourceData = { store };
  let form = { name: 'Old unsaved rename', description: 'An updated shop description.', area: 'Cape Town', phone: '' };
  const requests = []; let respond = async () => store;
  const react = { useState: initial => [initial, () => {}], useRef: initial => ({ current: initial }) };
  const storeEditorHook = loadTs('src/hooks/use-store-editor.ts', {
    react,
    '@/hooks/use-draft': { useDraft: (_key, initial) => [form || initial, next => { form = typeof next === 'function' ? next(form) : next; }] },
    '@/hooks/use-seller-inventory': { useSellerInventory: () => ({
      data: resourceData, loading: false, error: '', refresh() {},
      mutate: update => { resourceData = update(resourceData); },
    }) },
    '@/lib/api': { api: async (_path, init) => { requests.push(JSON.parse(init.body)); return respond(); } },
    '@/lib/auth': { useAuth: () => ({ session: { user: { uid: 'seller' } } }) },
    '@/lib/seller-events': { publishSellerChange() {} },
    '@/lib/session': {
      currentSession: () => ({ user: { uid: 'seller' } }),
      saveSession: async () => {},
    },
    '@/lib/store-form': loadTs('src/lib/store-form.ts'),
    '@/lib/toast': { toast: { error() {} } },
  });
  const { default: StoreEditor } = loadTs('src/app/selling/store.tsx', {
    react,
    'react/jsx-runtime': jsx, 'react-native': { Text: 'Text' },
    '@/components/market/Primitives': { Page: 'Page', Field: 'Field', Button: 'Button', ResourceState: 'ResourceState', SignInNotice: 'SignInNotice' },
    '@/components/market/OperatingAreaField': { OperatingAreaField: 'Area' },
    '@/components/selling/StoreEditorSkeleton': { StoreEditorSkeleton: 'StoreEditorSkeleton' },
    '@/components/selling/PhoneVerificationModal': { PhoneVerificationModal: 'PhoneVerificationModal' },
    '@/constants/market-theme': { ui: {} },
    '@/hooks/use-store-editor': storeEditorHook,
  });
  const render = () => elements(StoreEditor());
  return { requests, field: () => render().find(node => node.type === 'Field' && node.props.label === 'Store name'),
    save: () => render().find(node => node.type === 'Button').props.onPress(),
    button: () => render().find(node => node.type === 'Button'),
    update: next => { form = { ...form, ...next }; }, store, form: () => form,
    resourceData: () => resourceData, respond: callback => { respond = callback; } };
}

test('registered store names stay read-only and stale drafts cannot change the submitted name', async () => {
  const h = setup(false);
  assert.equal(h.field().props.editable, false);
  assert.equal(h.field().props.value, 'Approved business name');
  h.field().props.onChangeText('Attempted rename');
  assert.equal(h.form().name, 'Old unsaved rename');
  h.save(); await tick();
  assert.equal(h.requests[0].name, 'Approved business name');
  assert.equal(h.requests[0].description, 'An updated shop description.');
});

test('unchanged store details disable save and send zero requests, including resolved area labels and locked stale names', async () => {
  const h = setup(false);
  h.update({ description: h.store.description, area: 'Cape Town, South Africa', areaPlaceId: 'cape-town', areaSessionToken: 'display-only' });
  assert.equal(h.button().props.disabled, true);
  h.save(); await tick(); assert.equal(h.requests.length, 0);
  h.update({ description: 'A changed description.' });
  assert.equal(h.button().props.disabled, false);
  h.update({ description: `  ${h.store.description}  ` });
  assert.equal(h.button().props.disabled, true, 'whitespace normalized by the backend is not a change');
  h.update({ areaPlaceId: 'durban' });
  assert.equal(h.button().props.disabled, false);
  h.save(); await tick(); assert.equal(h.requests.length, 1);
});

test('renaming back to the saved name disables save for an individual seller', () => {
  const h = setup(true);
  h.update({ name: h.store.name, description: h.store.description, areaPlaceId: 'cape-town' });
  assert.equal(h.button().props.disabled, true);
  h.field().props.onChangeText('New name');
  assert.equal(h.button().props.disabled, false);
  h.field().props.onChangeText(h.store.name);
  assert.equal(h.button().props.disabled, true);
});

test('individual sellers can rename; unknown cached permissions keep the field read-only', async () => {
  const h = setup(true);
  assert.equal(h.field().props.editable, true);
  h.field().props.onChangeText('New trading name'); h.save(); await tick();
  assert.equal(h.requests[0].name, 'New trading name');
  assert.equal(setup(undefined).field().props.editable, false);
});

test('storefront changes render optimistically and restore the previous cache on rejection', async () => {
  const h = setup(true); let reject;
  h.respond(() => new Promise((_resolve, rejectRequest) => { reject = rejectRequest; }));
  h.update({ description: 'Optimistic description.' });
  h.save();
  assert.equal(h.resourceData().store.description, 'Optimistic description.');
  reject(new Error('Store update rejected.'));
  await tick();
  assert.equal(h.resourceData().store.description, h.store.description);
});
