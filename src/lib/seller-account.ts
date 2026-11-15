import { marketCache } from './market-cache';
import { currentSession } from './session';
import type { SellerAccount, SellerApplication } from '@/types/marketplace';
export function recordSellerApplication(uid: string, application: SellerApplication) {
  if (currentSession()?.user.uid === uid) {
    marketCache.set<SellerAccount>('/me', uid, account => ({ ...account, application }), false);
  }
}
