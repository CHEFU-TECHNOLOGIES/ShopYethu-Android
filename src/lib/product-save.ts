import { initialProduct, validateProductStep, type ProductForm } from './product-form';

export type ProductSaveAttempt = { version: 1; key: string; productId: string | null; body: string };
export function restoreProductSave(value: unknown): { attempt: ProductSaveAttempt; form: ProductForm } {
  if (!value || typeof value !== 'object') throw new Error('Invalid saved product attempt.');
  const attempt = value as ProductSaveAttempt;
  if (attempt.version !== 1 || typeof attempt.key !== 'string' || !/^[a-f\d-]{36}$/i.test(attempt.key) ||
    !(attempt.productId === null || typeof attempt.productId === 'string' && attempt.productId.length > 0 && attempt.productId.length <= 150 && !/[/\\]/.test(attempt.productId)) ||
    typeof attempt.body !== 'string' || attempt.body.length > 24000) throw new Error('Invalid saved product attempt.');
  const body = JSON.parse(attempt.body);
  if (!body || typeof body !== 'object' || typeof body.published !== 'boolean' ||
    !['name', 'description', 'category'].every(key => typeof body[key] === 'string') ||
    !Number.isSafeInteger(body.priceCents) || !Number.isSafeInteger(body.stock) ||
    !Array.isArray(body.photos) || body.photos.some((photo: unknown) => typeof photo !== 'string') ||
    !Array.isArray(body.fulfilment) || body.fulfilment.some((choice: unknown) => typeof choice !== 'string')) throw new Error('Incomplete saved product details.');
  const form = { ...initialProduct(), name: body.name, description: body.description, category: body.category,
    price: (body.priceCents / 100).toFixed(2), stock: String(body.stock), photos: body.photos, fulfilment: body.fulfilment };
  if ([0, 1, 2].some(step => validateProductStep(form, step))) throw new Error('Invalid saved product details.');
  return { attempt, form };
}
