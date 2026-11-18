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
  let form = { name: 'Old unsaved rename', description: 'An updated shop description.', area: 'Cape Town', phone: '', whatsappAvailable: false };
  const requests = []; let respond = async () => store; let backCount = 0;
  const router = { canGoBack: () => true, back: () => { backCount += 1; }, replace() {} };
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
    '@/lib/contact-phone': loadTs('src/lib/contact-phone.ts'),
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
    'expo-router': { useRouter: () => router },
    '@/components/market/Primitives': { Page: 'Page', Field: 'Field', Button: 'Button', ResourceState: 'ResourceState', SignInNotice: 'SignInNotice' },
    '@/components/market/OperatingAreaField': { OperatingAreaField: 'Area' },
    '@/components/selling/StoreEditorSkeleton': { StoreEditorSkeleton: 'StoreEditorSkeleton' },
    '@/components/selling/WhatsAppAvailabilityModal': { WhatsAppAvailabilityModal: 'WhatsAppAvailabilityModal' },
    '@/constants/market-theme': { ui: {} },
    '@/hooks/use-store-editor': storeEditorHook,
  });
  const render = () => elements(StoreEditor());
  const saveButton = () => render().find(node => node.type === 'Button' && node.props.title === 'Save storefront');
  return { requests, createEditor: storeEditorHook.useStoreEditor, field: () => render().find(node => node.type === 'Field' && node.props.label === 'Store name'),
    hasWhatsAppButton: () => render().some(node => node.type === 'Button' && node.props.title === 'Update WhatsApp availability'),
  whatsappModal: () => render().find(node => node.type === 'WhatsAppAvailabilityModal').props,
    save: () => saveButton().props.onPress(),
    button: saveButton,
    backCount: () => backCount,
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

test('successful storefront save returns to the previous screen', async () => {
  const h = setup(true);
  h.save();
  await tick();
  assert.equal(h.backCount(), 1);
});

test('contact confirmation returns only after the save succeeds', async () => {
  const h = setup(true);
  h.update({ phone: '082 123 4567' });
  h.save();
  await tick();
  assert.equal(h.requests.length, 0);
  assert.equal(h.backCount(), 0);

  h.whatsappModal().onConfirm(true);
  await tick();
  assert.equal(h.requests[0].whatsappAvailable, true);
  assert.equal(h.backCount(), 1);
});

test('changed contact details wait for WhatsApp confirmation and update the seller cache', async () => {
  const h = setup(true);
  assert.equal(h.hasWhatsAppButton(), false);
  h.update({ phone: '082 123 4567' });
  const editor = h.createEditor();
  await editor.save();
  assert.equal(h.requests.length, 0);

  editor.handleWhatsAppConfirm(true);
  await tick();
  assert.equal(h.requests[0].phone, '+27821234567');
  assert.equal(h.requests[0].whatsappAvailable, true);
  assert.equal(h.resourceData().phone, '+27821234567');
});

test('WhatsApp prompt offers simple yes and no choices', () => {
  const { WhatsAppAvailabilityModal } = loadTs('src/components/selling/WhatsAppAvailabilityModal.tsx', {
    react: { useState: initial => [initial, () => {}] },
    'react/jsx-runtime': jsx,
    'react-native': { Modal: 'Modal', StyleSheet: { create: styles => styles }, Text: 'Text', View: 'View' },
    '@/components/market/Primitives': { Button: 'Button' },
    '@/components/application/ApplicationChoices': { Choice: 'Choice' },
    '@/constants/market-theme': { palette: {}, ui: { heading: 'heading', small: 'small' } },
  });
  const tree = elements(WhatsAppAvailabilityModal({
    visible: true, whatsappAvailable: false, onConfirm() {}, onCancel() {},
  }));
  const choices = tree.filter(node => node.type === 'Choice');
  assert.deepEqual(choices.map(choice => choice.props.label), ['Yes', 'No']);
  const buttons = tree.filter(node => node.type === 'Button');
  assert.deepEqual(buttons.map(button => button.props.inline), [true, true]);
  assert.ok(tree.some(node => node.type === 'Text' &&
    node.props.children === 'Your phone number will be publicly visible on your storefront so shoppers can contact you.'));
});

test('storefront header hides WhatsApp icon when unavailable', () => {
  const { StorefrontHeader } = loadTs('src/components/market/StorefrontHeader.tsx', {
    'react/jsx-runtime': jsx,
    'react-native': { StyleSheet: { create: styles => styles }, Text: 'Text', View: 'View' },
    '@/components/market/OperatingAreaLabel': { OperatingAreaLabel: 'OperatingAreaLabel' },
    '@/components/market/CatalogSortSelector': { CatalogSortSelector: 'CatalogSortSelector' },
    '@expo/vector-icons': { FontAwesome: 'FontAwesome', MaterialIcons: 'MaterialIcons' },
    '@/constants/market-theme': { palette: {}, ui: {} },
  });
  const store = {
    id: 'seller', ownerUid: 'seller', name: 'Test store', description: '',
    area: 'Cape Town', phone: '+27821234567', status: 'active', reason: '',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
  const icons = (whatsappAvailable) => elements(StorefrontHeader({
    store: { ...store, whatsappAvailable },
    sort: 'newest',
    onSortChange() {},
  })).filter(node => node.type === 'FontAwesome');
  assert.deepEqual(icons(true).map(icon => icon.props.name), ['phone', 'whatsapp']);
  assert.deepEqual(icons(false).map(icon => icon.props.name), ['phone']);
});
