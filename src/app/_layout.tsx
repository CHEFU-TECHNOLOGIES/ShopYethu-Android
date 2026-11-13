import { useEffect } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '@/lib/auth';
import { CartProvider } from '@/lib/cart';

void SplashScreen.preventAutoHideAsync();
export default function RootLayout() {
  useEffect(() => { void SplashScreen.hideAsync(); }, []);
  return <AuthProvider><CartProvider><StatusBar style="dark" /><Stack screenOptions={{ headerShown: false }}><Stack.Screen name="(tabs)" /></Stack></CartProvider></AuthProvider>;
}
