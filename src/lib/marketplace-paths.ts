export const SELLER_INVENTORY_PATH = '/seller/store?page=1';

export function isSellerInventoryPath(path: string) {
  return path.split('?')[0] === '/seller/store';
}

export function isSellerInventoryPageRequest(path: string) {
  if (!isSellerInventoryPath(path)) return false;
  const query = path.split('?')[1];
  if (!query) return false;
  const params = new URLSearchParams(query);
  return params.has('page') || params.has('after');
}

export function hasSellerInventoryPageShape(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  return Array.isArray(record.products) &&
    (record.nextCursor === null || typeof record.nextCursor === 'string' && record.nextCursor.length > 0);
}
