import type { createQueryCache } from './query-cache';
import type { Product, Storefront } from '@/types/marketplace';
import { SELLER_INVENTORY_PATH } from './marketplace-paths';

type Cache = ReturnType<typeof createQueryCache>;
type Inventory = { store: Storefront; products: Product[] };

// Inventory contains complete owned products, unlike compact public cards.
// Reuse its original timestamp so navigation never extends the cache's age.
export function reuseOwnedProduct(cache: Cache, path: string, scope: string) {
  if (scope === 'public' || !path.startsWith('/seller/products/')) return;
  const target = cache.get(path, scope);
  if (target.data !== null || target.error) return;
  const inventory = cache.get<Inventory>(SELLER_INVENTORY_PATH, scope);
  if (!inventory.data || inventory.error || inventory.updatedAt === null) return;
  const { store, products } = inventory.data;
  if (!store || store.status !== 'active' || store.ownerUid !== scope || !Array.isArray(products)) return;
  const product = products.find(item => `/seller/products/${encodeURIComponent(item.id)}` === path &&
    item.ownerUid === scope && item.storeId === store.id);
  if (!product) return;
  cache.restore([{ path, scope, data: { store, product }, updatedAt: inventory.updatedAt }], scope);
}
