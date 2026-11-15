import { useEffect, useSyncExternalStore } from 'react';
import { AppState, Pressable, StyleSheet, Text, useColorScheme } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Feather from '@expo/vector-icons/Feather';
import { retryMarketplaceConnection } from '@/lib/market-recovery';
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
    const listener = AppState.addEventListener('change', state => {
      if (state === 'active') void retryMarketplaceConnection().catch(() => undefined);
    });
    return () => listener.remove();
  }, [online]);
  if (online !== false) return null;
  return <Pressable accessibilityRole="button" accessibilityLabel="Connection unavailable. Showing saved data. Tap to retry."
    onPress={() => { void retryMarketplaceConnection().catch(() => undefined); }}
    style={[styles.indicator, { bottom: insets.bottom + 68, backgroundColor: dark ? '#26312a' : '#f1f5f2' }]}>
    <Feather name="wifi-off" size={13} color={dark ? '#c7d5cd' : '#53675a'} />
    <Text style={{ fontSize: 12, color: dark ? '#c7d5cd' : '#53675a' }}>Connection unavailable · Saved data</Text>
  </Pressable>;
}
const styles = StyleSheet.create({ indicator: { position: 'absolute', alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 7,
  borderRadius: 20, paddingHorizontal: 14, paddingVertical: 10, elevation: 3 } });
