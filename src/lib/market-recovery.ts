import { api } from './api';
import { marketCache } from './market-cache';

let pending: Promise<void> | null = null;

// One shared lightweight attempt only when the user taps Retry.
export function retryMarketplaceConnection() {
  if (pending) return pending;
  pending = api('/config').then(config => {
    marketCache.set('/config', 'public', config);
    marketCache.refreshActive(true);
  }).finally(() => { pending = null; });
  return pending;
}
