import { api } from './api';
import { marketCache } from './market-cache';

let pending: Promise<void> | null = null;

// One lightweight attempt on an explicit retry/offline resume. No idle polling.
export function retryMarketplaceConnection() {
  if (pending) return pending;
  pending = api('/config').then(config => {
    marketCache.set('/config', 'public', config);
    marketCache.refreshActive(true);
  }).finally(() => { pending = null; });
  return pending;
}
