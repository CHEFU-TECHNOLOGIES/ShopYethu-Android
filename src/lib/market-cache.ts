import * as SecureStore from 'expo-secure-store';
import { api, ApiError } from './api';
import { currentSession, subscribe } from './session';
import { createQueryCache } from './query-cache';
import { createQueryPersistence } from './query-persistence';
import { createApplicationDraftStore } from './application-draft-store';
import { canonicalPath, publicQuery } from './query-policy';
import { onApiMutation, onApiRejection } from './api-events';
import { toast, toastStore } from './toast';
import { readSellerAccount } from './seller-account-cache';
import { cacheSavedProduct, cacheSavedStore, invalidateOrderStock } from './market-cache-updates';
import type { Order, Product, SellerAccount, SellerApplication, Storefront } from '@/types/marketplace';

export const marketCache = createQueryCache(async (path, signal, scope) => {
  if (scope !== 'public' && currentSession()?.user.uid !== scope) throw new ApiError('Please sign in again.', 401);
  const data = await api(path, { signal });
  if (scope !== 'public' && currentSession()?.user.uid !== scope) throw new ApiError('Your account changed. Please retry.', 401);
  return path === '/me' ? readSellerAccount(data, currentSession()!.user.uid) : data;
});
const persistence = createQueryPersistence(marketCache, createApplicationDraftStore(SecureStore));
let identity: string | null = null;
export function activateMarketCache(uid: string | null) {
  if (identity !== uid) { marketCache.clearPrivate(); toastStore.clear(); identity = uid; }
  return persistence.activate(uid);
}
subscribe(session => { void activateMarketCache(session?.user.uid || null); });
export function queryScope(path: string, uid: string | null) { return publicQuery(path) ? 'public' : uid || 'guest'; }
export async function loadMarketQuery(path: string, scope: string, force = false, maxStaleMs?: number) {
  await activateMarketCache(currentSession()?.user.uid || null);
  if (scope !== 'public' && scope !== identity) return;
  return marketCache.load(canonicalPath(path), scope, force, maxStaleMs);
}
export const flushMarketCache = () => persistence.flush();
export function prefetchProduct(id: string) { void loadMarketQuery(`/products/${encodeURIComponent(id)}`, 'public'); }
onApiRejection(rejectedPath => {
  marketCache.invalidate(path => path.startsWith('/seller') && path !== rejectedPath, true);
  if (rejectedPath !== '/me') marketCache.invalidate(path => path === '/me');
});
function updateOrder(path: string, uid: string, order: Order) {
  marketCache.set<{ orders: Order[] }>(path, uid, current => ({ orders: [order, ...current.orders.filter(item => item.id !== order.id)] }), false);
}
// Reuse confirmed mutation responses; mark dependent snapshots stale without erasing them.
onApiMutation(({ path, data }) => {
  const uid = currentSession()?.user.uid;
  if (!uid) return;
  if (path === '/application') {
    toast.success('Your seller application was submitted.');
    marketCache.set<SellerAccount>('/me', uid, current => ({ ...current, application: data as SellerApplication }), false);
  } else if (path === '/seller/store') {
    toast.success('Store details updated.');
    const store = data as Storefront;
    marketCache.set<SellerAccount>('/me', uid, current => ({ ...current, store }), false);
    marketCache.set<{ store: Storefront; products: Product[] }>('/seller/store', uid, current => ({ ...current, store }), false);
    cacheSavedStore(marketCache, store);
  } else if (/^\/seller\/products(?:\/|$)/.test(path)) {
    const product = data as Product;
    toast.success(product.published ? 'Your product is published.' : 'Draft saved.');
    marketCache.set<{ store: Storefront; products: Product[] }>('/seller/store', uid, current => ({ ...current,
      products: [product, ...current.products.filter(item => item.id !== product.id)] }), false);
    cacheSavedProduct(marketCache, uid, product);
  } else if (path === '/orders' || path.startsWith('/seller/orders/')) {
    toast.success(path === '/orders' ? 'Order placed. Payment is due on collection.' : path.endsWith('/payment') ? 'Payment confirmed as received.' : 'Order status updated.');
    const order = data as Order;
    if (order.buyerUid === uid) updateOrder('/orders', uid, order);
    if (order.sellerUid === uid) updateOrder('/seller/orders', uid, order);
    // Preparing/ready/payment updates do not change stock or catalogue contents.
    if (path === '/orders' || order.status === 'cancelled') {
      invalidateOrderStock(marketCache, uid, order);
    }
  } else if (path === '/reports') toast.success('Your report was received.');
});
