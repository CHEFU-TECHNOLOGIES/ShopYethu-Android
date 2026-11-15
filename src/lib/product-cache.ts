import { loadMarketQuery, marketCache } from './market-cache';
import { queryUsage } from './query-policy';
import type { Product, Storefront } from '@/types/marketplace';

export async function productForUse(id: string, force = false) {
  const path = `/products/${encodeURIComponent(id)}`;
  await loadMarketQuery(path, 'public', force, queryUsage(path));
  const snapshot = marketCache.get<{ product: Product; store: Storefront }>(path, 'public');
  if (snapshot.error || !snapshot.data) throw new Error(snapshot.error || 'This product is unavailable. Please try again.');
  return snapshot.data.product;
}
