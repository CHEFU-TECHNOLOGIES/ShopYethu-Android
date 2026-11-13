import { Image, Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import type { Product } from '@/types/marketplace';
import { money, palette, ui } from '@/constants/market-theme';

export function ProductCard({ product }: { product: Product & { storeName?: string } }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={`${product.name}, ${money(product.priceCents)}`} onPress={() => router.push({ pathname: '/product/[id]', params: { id: product.id } })} style={{ width: '48%', marginBottom: 16 }}>
    <View style={{ borderRadius: 16, overflow: 'hidden', backgroundColor: palette.soft, aspectRatio: 0.95 }}><Image source={{ uri: product.photos[0] }} style={{ width: '100%', height: '100%' }} resizeMode="cover" /></View>
    <View style={{ paddingTop: 10, gap: 4 }}><Text style={ui.small} numberOfLines={1}>{product.storeName || product.category}</Text><Text style={[ui.body, { fontSize: 14, fontWeight: '600' }]} numberOfLines={2}>{product.name}</Text><Text style={[ui.heading, { fontSize: 16 }]}>{money(product.priceCents)}</Text>{product.stock === 0 && <Text style={ui.error}>Sold out</Text>}</View>
  </Pressable>;
}
