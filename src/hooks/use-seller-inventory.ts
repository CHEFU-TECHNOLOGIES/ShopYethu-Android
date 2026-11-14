import { useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { subscribeSellerChanges } from '@/lib/seller-events';
import { useResource } from './use-resource';
import type { Product, Storefront } from '@/types/marketplace';

export type SellerInventory = { store: Storefront; products: Product[] };
export function useSellerInventory(enabled = true) {
  const { session } = useAuth();
  const uid = session?.user.uid;
  const resource = useResource<SellerInventory>('/seller/store', enabled && !!uid);
  const { mutate } = resource;
  useEffect(() => subscribeSellerChanges(change => {
    if (!uid || change.uid !== uid) return;
    mutate(current => ({
      store: change.store || current.store,
      products: change.product
        ? [change.product, ...current.products.filter(product => product.id !== change.product!.id)]
        : current.products,
    }));
  }), [uid, mutate]);
  return resource;
}
