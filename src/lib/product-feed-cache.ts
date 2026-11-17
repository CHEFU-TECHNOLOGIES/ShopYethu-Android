import type { createQueryCache } from './query-cache';
import type { Product, Storefront } from '@/types/marketplace';

type Feed = { products?: Product[]; store?: Storefront };

export function updateProductFeeds(cache: ReturnType<typeof createQueryCache>, product: Product) {
  const changedMembership = new Set<string>();
  cache.patch<Feed>((path, scope) => scope === 'public' &&
    (path.split('?')[0] === '/products' || path.startsWith('/stores/')), (current, path) => {
    const [pathname, query] = path.split('?'), filters = new URLSearchParams(query);
    const storeId = pathname.startsWith('/stores/') ? decodeURIComponent(pathname.slice('/stores/'.length)) : filters.get('store');
    if (storeId && storeId !== product.storeId || !current.products) return current;
    const present = current.products.some(item => item.id === product.id);
    const category = filters.get('category'), queryText = (filters.get('q') || '').toLowerCase();
    const matches = product.published && (!category || category === product.category) &&
      `${product.name} ${product.description}`.toLowerCase().includes(queryText);
    if (!present) {
      // A new matching listing can change page membership and cursor boundaries.
      if (matches) changedMembership.add(path);
      return current;
    }
    // Existing rows can be updated/removed directly from the confirmed response.
    return { ...current, products: current.products.flatMap(item => item.id !== product.id ? [item]
      : matches ? [{ ...item, ...product }] : []) };
  });
  cache.invalidate((path, scope) => scope === 'public' && changedMembership.has(path));
}
