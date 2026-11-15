import { useEffect, useSyncExternalStore } from 'react';
import { AppState, Pressable, StyleSheet, Text, useColorScheme } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Feather from '@expo/vector-icons/Feather';
import { api } from '@/lib/api';
import { networkState } from '@/lib/network-state';
import { activateMarketCache, flushMarketCache, marketCache } from '@/lib/market-cache';
import { currentSession } from '@/lib/session';
import { useAuth } from '@/lib/auth';

export function MarketplaceSync() {
  const { ready } = useAuth();
  const online = useSyncExternalStore(networkState.subscribe, networkState.get, networkState.get);
  const insets = useSafeAreaInsets(), dark = useColorScheme() === 'dark';
  useEffect(() => {
    if (ready) void activateMarketCache(currentSession()?.user.uid || null);
  }, [ready]);
  useEffect(() => {
    const listener = AppState.addEventListener('change', state => {
      if (state === 'active') marketCache.refreshActive();
      else { marketCache.cancelAll(); void flushMarketCache(); }
    });
    return () => listener.remove();
  }, []);
  useEffect(() => {
    if (online !== false) return;
    let cancelled = false, timer: ReturnType<typeof setTimeout> | undefined, delay = 15_000;
    const check = async () => {
      if (cancelled || AppState.currentState !== 'active') return;
      try { await api('/config'); marketCache.refreshActive(true); }
      catch { delay = Math.min(delay * 2, 60_000); if (!cancelled) timer = setTimeout(check, delay); }
    };
    timer = setTimeout(check, delay);
    const listener = AppState.addEventListener('change', state => {
      clearTimeout(timer);
      if (state === 'active') void check();
    });
    return () => { cancelled = true; clearTimeout(timer); listener.remove(); };
  }, [online]);
  if (online !== false) return null;
  return <Pressable accessibilityRole="button" accessibilityLabel="Connection unavailable. Showing saved data. Tap to retry."
    onPress={() => { void api('/config').then(() => marketCache.refreshActive(true)).catch(() => undefined); }}
    style={[styles.indicator, { bottom: insets.bottom + 68, backgroundColor: dark ? '#26312a' : '#f1f5f2' }]}>
    <Feather name="wifi-off" size={13} color={dark ? '#c7d5cd' : '#53675a'} />
    <Text style={{ fontSize: 12, color: dark ? '#c7d5cd' : '#53675a' }}>Connection unavailable · Saved data</Text>
  </Pressable>;
}
const styles = StyleSheet.create({ indicator: { position: 'absolute', alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 7,
  borderRadius: 20, paddingHorizontal: 14, paddingVertical: 10, elevation: 3 } });
