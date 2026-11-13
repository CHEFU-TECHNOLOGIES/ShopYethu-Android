import { Tabs } from 'expo-router';
import { palette } from '@/constants/market-theme';
export default function AppTabs() {
  return <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: palette.brand, tabBarStyle: { backgroundColor: palette.paper } }}>
    <Tabs.Screen name="index" options={{ title: 'Shop' }} /><Tabs.Screen name="cart" options={{ title: 'Basket' }} /><Tabs.Screen name="orders" options={{ title: 'Orders' }} /><Tabs.Screen name="account" options={{ title: 'Account' }} />
  </Tabs>;
}
