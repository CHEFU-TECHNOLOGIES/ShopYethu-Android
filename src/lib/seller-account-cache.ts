import type { SellerAccount } from '@/types/marketplace';
export function readSellerAccount(value: unknown, uid: string): SellerAccount {
  if (!value || typeof value !== 'object') throw new Error('Invalid seller status response. Please refresh.');
  const { application, store } = value as SellerAccount;
  if (application !== null && (!application || application.id !== uid || application.ownerUid !== uid ||
    typeof application.businessName !== 'string' || !['pending', 'more-info', 'approved', 'rejected'].includes(application.status)) ||
    store !== null && (!store || store.id !== uid || store.ownerUid !== uid || typeof store.name !== 'string' || !['active', 'suspended'].includes(store.status))) {
    throw new Error('Invalid seller status response. Please refresh.');
  }
  return { application, store };
}
