import assert from 'node:assert/strict';
import { test } from 'node:test';
import { initialProduct, productPayload, validateProductStep, validPhotoUrl } from '../src/lib/product-form.ts';

const form = () => ({ ...initialProduct(), name: 'Unit test product', description: 'Used only by isolated tests.', price: '25,50', stock: '4' });

test('drafts and published products both require a valid cover photo', () => {
  const draft = form();
  assert.match(validateProductStep(draft, 1), /photo/);
  draft.photos = ['https://example.test/photo.png'];
  assert.equal(validateProductStep(draft, 1), '');
  assert.equal(validPhotoUrl('file:///private/photo.jpg'), false);
  assert.equal(validPhotoUrl('https://name:secret@example.test/photo.png'), false);
  assert.equal(validPhotoUrl('https://example.test/photo.png'), true);
});

test('queued local photos are valid only while staged in the editor', () => {
  const draft = form();
  const localPhoto = 'file:///cache/product-photo.jpg';
  draft.photos = [localPhoto];
  assert.ok(validateProductStep(draft, 1));
  assert.equal(validateProductStep(draft, 1, new Set([localPhoto])), '');
});

test('prices use exact rand input; invalid quantities and unsupported fulfilment are rejected', () => {
  const draft = form();
  assert.equal(validateProductStep(draft, 2), '');
  for (const price of ['', '0', '-1', '1.001', '1e3', 'Infinity', '1000001']) assert.ok(validateProductStep({ ...draft, price }, 2));
  for (const stock of ['', '-1', '1.5', '1e3', '100001']) assert.ok(validateProductStep({ ...draft, stock }, 2));
  assert.equal(validateProductStep({ ...draft, stock: '0' }, 2), '');
  assert.ok(validateProductStep({ ...draft, fulfilment: [] }, 2));
});

test('edit payloads preserve fulfilment and carry the original version and stock for concurrency checks', () => {
  const previous = { name: 'Stored name', description: 'Stored description', category: 'Other', priceCents: 2550, stock: 4, photos: ['https://example.test/photo.png'], fulfilment: ['local-delivery', 'collection'], updatedAt: 'server-version' };
  const draft = initialProduct(previous);
  assert.deepEqual(draft.fulfilment, ['local-delivery', 'collection']);
  const payload = productPayload({ ...draft, price: '30,75', stock: '3' }, true, previous);
  assert.equal(payload.priceCents, 3075);
  assert.equal(payload.stock, 3);
  assert.equal(payload.expectedStock, 4);
  assert.equal(payload.expectedUpdatedAt, 'server-version');
  assert.equal('expectedStock' in productPayload(form(), false), false);
});
