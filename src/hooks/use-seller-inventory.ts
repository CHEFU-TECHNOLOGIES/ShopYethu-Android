import { useRef, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { SELLER_INVENTORY_PATH } from '@/lib/marketplace-paths';
import { loadMarketQuery, marketCache } from '@/lib/market-cache';
import { canonicalPath } from '@/lib/query-policy';
import { toast } from '@/lib/toast';
import type { SellerInventory } from '@/types/marketplace';
import { useResource } from './use-resource';

export function useSellerInventory(enabled = true) {
    const resource = useResource<SellerInventory>(SELLER_INVENTORY_PATH, enabled);
    const { session } = useAuth();
    const lock = useRef(false);
    const [loadingMore, setLoadingMore] = useState(false);

    async function more() {
        const cursor = resource.data?.nextCursor;
        const uid = session?.user.uid;
        if (!cursor || !uid || lock.current) return;
        lock.current = true;
        setLoadingMore(true);
        const base = canonicalPath(SELLER_INVENTORY_PATH);
        const next = `${base}&after=${encodeURIComponent(cursor)}`;
        try {
            await loadMarketQuery(next, uid);
            const page = marketCache.get<SellerInventory>(next, uid);
            if (page.error) {
                toast.error(page.error);
                return;
            }
            if (!page.data) return;
            marketCache.set<SellerInventory>(SELLER_INVENTORY_PATH, uid, previous => {
                if (previous.nextCursor !== cursor) return previous;
                const seen = new Set(previous.products.map(product => product.id));
                return {
                    ...previous,
                    products: [...previous.products, ...page.data!.products.filter(product => !seen.has(product.id))],
                    nextCursor: page.data!.nextCursor,
                };
            }, false);
        } finally {
            lock.current = false;
            setLoadingMore(false);
        }
    }

    return { ...resource, more, loadingMore };
}
