import { useEffect } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '@/lib/auth';
import { CartProvider } from '@/lib/cart';
import { WelcomeProvider, useWelcome } from '@/lib/welcome';

void SplashScreen.preventAutoHideAsync();
export default function RootLayout() {
  return (
    <AuthProvider>
      <WelcomeProvider>
        <CartProvider>
          <AppNavigator />
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
        <Stack.Screen name="welcome" options={{ animation: 'fade' }} />
      </Stack>
    </>
  );
}
