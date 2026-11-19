import { useEffect } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { AuthProvider, useAuth } from '@/lib/auth';
import { CartProvider } from '@/lib/cart';
import { WelcomeProvider, useWelcome } from '@/lib/welcome';
import { ToastHost } from '@/components/feedback/ToastHost';
import { MarketplaceSync } from '@/components/feedback/MarketplaceSync';

void SplashScreen.preventAutoHideAsync();
export default function RootLayout() {
  return (
    <AuthProvider>
      <WelcomeProvider>
        <CartProvider>
          <KeyboardProvider preload={false}>
            <AppNavigator />
          </KeyboardProvider>
        </CartProvider>
      </WelcomeProvider>
    </AuthProvider>
  );
}

function AppNavigator() {
  const { ready: authReady } = useAuth();
  const { ready: welcomeReady } = useWelcome();

  useEffect(() => {
    if (authReady && welcomeReady) void SplashScreen.hideAsync();
  }, [authReady, welcomeReady]);

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="cart"
          options={{ animation: "slide_from_right" }}
        />
        <Stack.Screen
          name="notification-settings"
          options={{ animation: "slide_from_right" }}
        />
        <Stack.Screen name="welcome" options={{ animation: 'fade' }} />
      </Stack>
      <MarketplaceSync />
      <ToastHost />
    </>
  );
}
