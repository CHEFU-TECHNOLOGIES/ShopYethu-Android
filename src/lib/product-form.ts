import type { Fulfilment, Product } from '@/types/marketplace';

export const productSteps = ['Details', 'Photos', 'Price & stock', 'Review'];
export type ProductForm = { name: string; description: string; category: string; price: string; stock: string; photos: string[]; fulfilment: Fulfilment[] };
export function initialProduct(product?: Product): ProductForm {
  return product ? {
    name: product.name, description: product.description, category: product.category,
    price: (product.priceCents / 100).toFixed(2), stock: String(product.stock),
    photos: [...product.photos], fulfilment: [...product.fulfilment],
  } : { name: '', description: '', category: 'Other', price: '', stock: '', photos: [], fulfilment: ['collection'] };
}
export function validPhotoUrl(value: string) {
  try { const url = new URL(value); return value.length <= 2048 && url.protocol === 'https:' && !url.username && !url.password; }
  catch { return false; }
}
export function validateProductStep(
  form: ProductForm,
  step: number,
  stagedPhotos?: ReadonlySet<string>,
) {
  if (step === 0) {
    if (form.name.trim().length < 2 || form.name.trim().length > 120) return 'Enter a product name (2–120 characters).';
    if (form.description.trim().length < 10 || form.description.trim().length > 4000) return 'Add a description (10–4,000 characters).';
    if (form.category.trim().length < 2 || form.category.length > 60) return 'Choose a product category.';
  }
  if (step === 1) {
    if (form.photos.length > 5 || form.photos.some(url => !validPhotoUrl(url) && !stagedPhotos?.has(url))) return 'Use up to five valid HTTPS product photos.';
    if (!form.photos.length) return 'Add at least one photo before continuing.';
  }
  if (step === 2) {
    if (!/^\d+(?:[.,]\d{1,2})?$/.test(form.price.trim())) return 'Enter a price in rand, with up to two decimal places.';
    const cents = Math.round(Number(form.price.trim().replace(',', '.')) * 100);
    if (!Number.isSafeInteger(cents) || cents < 100 || cents > 100000000) return 'Set a price between R 1.00 and R 1,000,000.00.';
    if (!/^\d+$/.test(form.stock.trim()) || Number(form.stock) > 100000) return 'Enter stock as a whole number from 0 to 100,000.';
    if (!form.fulfilment.length || form.fulfilment.some(value => !['collection', 'local-delivery'].includes(value))) return 'Choose a supported fulfilment option.';
  }
  return '';
}
export function productPayload(form: ProductForm, published: boolean, previous?: Product) {
  return {
    name: form.name.trim(), description: form.description.trim(), category: form.category.trim(),
    priceCents: Math.round(Number(form.price.trim().replace(',', '.')) * 100), stock: Number(form.stock),
    photos: form.photos, fulfilment: form.fulfilment, published,
    ...(previous ? { expectedUpdatedAt: previous.updatedAt, expectedStock: previous.stock } : {}),
  };
}
