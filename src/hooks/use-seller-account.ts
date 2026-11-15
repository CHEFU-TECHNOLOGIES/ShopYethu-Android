import { useResource } from './use-resource';
import type { SellerAccount } from '@/types/marketplace';
export function useSellerAccount(enabled = true) { return useResource<SellerAccount>('/me', enabled); }
