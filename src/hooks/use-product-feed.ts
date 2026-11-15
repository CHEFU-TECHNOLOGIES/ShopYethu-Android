import { useRef, useState } from 'react';
import { useResource } from './use-resource';
import { loadMarketQuery, marketCache } from '@/lib/market-cache';
import { canonicalPath, queryUsage } from '@/lib/query-policy';
import { toast } from '@/lib/toast';
import type { Product } from '@/types/marketplace';

export type ProductFeed = { products: (Product & { storeName?: string })[]; nextCursor?: string | null };
export function useProductFeed<T extends ProductFeed = ProductFeed>(path: string, morePath = path) {
  const resource = useResource<T>(path);
  const lock = useRef(false), [loadingMore, setLoadingMore] = useState(false);
  async function more() {
    const cursor = resource.data?.nextCursor;
    if (!cursor || lock.current) return;
    lock.current = true; setLoadingMore(true);
    const base = canonicalPath(morePath);
    const next = `${base}${base.includes('?') ? '&' : '?'}after=${encodeURIComponent(cursor)}`;
    try {
      await loadMarketQuery(next, 'public', false, queryUsage(next));
      const page = marketCache.get<ProductFeed>(next, 'public');
      if (page.error) { toast.error(page.error); return; }
      if (!page.data) return;
      marketCache.set<T>(path, 'public', previous => {
        if (previous.nextCursor !== cursor) return previous;
        const seen = new Set(previous.products.map(item => item.id));
        return { ...previous, products: [...previous.products, ...page.data!.products.filter(item => !seen.has(item.id))], nextCursor: page.data!.nextCursor };
      }, false);
    } finally { lock.current = false; setLoadingMore(false); }
  }
  return { ...resource, more, loadingMore };
}
