import { useCallback, useSyncExternalStore } from 'react';
import { useFocusEffect } from 'expo-router';
import { useAuth } from '@/lib/auth';
import { loadMarketQuery, marketCache, queryScope } from '@/lib/market-cache';
import { canonicalPath, publicQuery } from '@/lib/query-policy';
import { toast } from '@/lib/toast';

export function useResource<T>(path: string, enabled = true) {
  const { session, ready } = useAuth();
  const uid = ready ? session?.user.uid || null : null;
  const canonical = canonicalPath(path), scope = queryScope(canonical, uid);
  const allowed = enabled && ready && (publicQuery(canonical) || !!uid);
  const subscribe = useCallback((listener: () => void) => marketCache.subscribe(canonical, scope, listener), [canonical, scope]);
  const snapshot = useCallback(() => marketCache.get<T>(canonical, scope), [canonical, scope]);
  const state = useSyncExternalStore(subscribe, snapshot, snapshot);
  useFocusEffect(useCallback(() => {
    if (!allowed) return;
    const stop = marketCache.observe(canonical, scope);
    void loadMarketQuery(canonical, scope);
    return stop;
  }, [canonical, scope, allowed]));
  const refresh = useCallback(() => {
    if (allowed) void loadMarketQuery(canonical, scope, true).then(() => {
      const failure = marketCache.get(canonical, scope).error;
      if (failure) toast.error(failure);
    });
  }, [allowed, canonical, scope]);
  const mutate = useCallback((update: (previous: T) => T) => marketCache.set(canonical, scope, update, false), [canonical, scope]);
  return { ...state, data: allowed ? state.data : null, error: allowed ? state.error : '',
    loading: allowed && (state.loading || !state.data && !state.error), refresh, mutate };
}
