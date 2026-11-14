import type { Product, Storefront } from '@/types/marketplace';

export type SellerChange = { uid: string; product?: Product; store?: Storefront };
const listeners = new Set<(change: SellerChange) => void>();
export function subscribeSellerChanges(listener: (change: SellerChange) => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}
// The successful server response updates open seller screens without another API read.
export function publishSellerChange(change: SellerChange) { listeners.forEach(listener => listener(change)); }
