import type { createQueryCache } from './query-cache';
import type { DeletedProduct, Order, Product, Storefront } from '@/types/marketplace';
import { updateProductFeeds } from './product-feed-cache';
import { isSellerInventoryPath } from './marketplace-paths';

type Cache = ReturnType<typeof createQueryCache>;
type ProductSnapshot = { product?: Product; products?: (Product & { storeName?: string })[]; store?: Storefront };
const isPublicProduct = (path: string) => path.split('?')[0].startsWith('/products/');
const isFeed = (path: string) => path.split('?')[0] === '/products';

export function cacheSavedStore(cache: Cache, store: Storefront) {
  cache.patch<ProductSnapshot>((path, scope) => scope === 'public' && (path.startsWith('/products') || path.startsWith('/stores/')), current => {
    const storeChanged = current.store?.id === store.id;
    const productsChanged = current.products?.some(product => product.storeId === store.id);
    if (!storeChanged && !productsChanged) return current;
    return { ...current, ...(storeChanged ? { store: { ...current.store, ...store } } : {}), ...(productsChanged ? {
      products: current.products!.map(product => product.storeId === store.id ? { ...product, storeName: store.name } : product),
    } : {}) };
  });
}

export function cacheSavedProduct(cache: Cache, uid: string, product: Product) {
  const publicPath = `/products/${encodeURIComponent(product.id)}`;
  const privatePath = `/seller/products/${encodeURIComponent(product.id)}`;
  cache.patch<ProductSnapshot>((path, scope) => scope === uid && path === privatePath || scope === 'public' && path === publicPath && product.published,
    current => ({ ...current, product }));
  if (!product.published) cache.invalidate((path, scope) => scope === 'public' && path === publicPath, true);
  updateProductFeeds(cache, product);
}

export function invalidateOrderStock(cache: Cache, uid: string, order: Order) {
  const ids = new Set((order.items || []).map(item => encodeURIComponent(item.productId)));
  cache.invalidate((path, scope) => scope === 'public' && (isFeed(path) || path.split('?')[0] === `/stores/${order.storeId}` ||
    isPublicProduct(path) && ids.has(path.split('?')[0].slice('/products/'.length))) ||
    scope === uid && (isSellerInventoryPath(path) || path.startsWith('/seller/products/') && ids.has(path.slice('/seller/products/'.length))));
}

export function cacheDeletedProduct(cache: Cache, uid: string, product: DeletedProduct) {
  cache.patch<ProductSnapshot>((path, scope) => scope === uid && isSellerInventoryPath(path) ||
    scope === 'public' && (isFeed(path) || path.startsWith('/stores/')), current => {
    if (!current.products?.some(item => item.id === product.id)) return current;
    return { ...current, products: current.products.filter(item => item.id !== product.id) };
  });
  cache.invalidate((path, scope) => scope === uid && path === `/seller/products/${encodeURIComponent(product.id)}` ||
    scope === 'public' && path === `/products/${encodeURIComponent(product.id)}`, true);
}
