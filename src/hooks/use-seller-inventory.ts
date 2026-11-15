import { useResource } from './use-resource';
import type { Product, Storefront } from '@/types/marketplace';
export type SellerInventory = { store: Storefront; products: Product[] };
export function useSellerInventory(enabled = true, maxStaleMs?: number) { return useResource<SellerInventory>('/seller/store', enabled, maxStaleMs); }
