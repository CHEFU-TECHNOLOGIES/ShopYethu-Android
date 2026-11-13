import { Text } from 'react-native';
import { Button, Page } from '@/components/market/Primitives';
import { router } from 'expo-router';
import { ui } from '@/constants/market-theme';
export default function Callback() { return <Page title="Back to ShopYethu"><Text style={ui.subtitle}>Return to Account to finish or retry your sign-in.</Text><Button title="Go to account" onPress={() => router.replace('/account')} /></Page>; }
