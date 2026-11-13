import { useState } from 'react';
import { Image, ScrollView, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Button, Page, ResourceState } from '@/components/market/Primitives';
import { useResource } from '@/hooks/use-resource';
import { useCart } from '@/lib/cart';
import type { Product, Storefront } from '@/types/marketplace';
import { money, palette, ui } from '@/constants/market-theme';

export default function ProductScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const resource = useResource<{ product: Product; store: Storefront }>(`/products/${id}`);
  const { add } = useCart();
  const [notice, setNotice] = useState('');
  const product = resource.data?.product, store = resource.data?.store;
  return <Page title={product?.name || 'Product details'} back>
    <ResourceState {...resource} retry={resource.refresh} />
    {product && store && <>
      <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>{product.photos.map(photo => <Image key={photo} source={{ uri: photo }} style={{ width: 320, height: 300, borderRadius: 20, backgroundColor: palette.soft }} resizeMode="cover" />)}</ScrollView>
      <View style={ui.between}><Text style={[ui.title, { fontSize: 27 }]}>{money(product.priceCents)}</Text><Text style={ui.badge}>{product.stock > 0 ? `${product.stock} available` : 'Sold out'}</Text></View>
      <Text style={ui.body}>{product.description}</Text>
      <View style={ui.card}><Text style={ui.heading}>{store.name}</Text><Text style={ui.small}>{store.area}</Text><Text style={ui.subtitle}>Fulfilment: {product.fulfilment.map(value => value === 'collection' ? 'Collection' : 'Local delivery').join(' · ')}</Text><Button title="Visit storefront" secondary onPress={() => router.push({ pathname: '/store/[id]', params: { id: store.id } })} /></View>
      {notice && <Text accessibilityRole="alert" style={ui.body}>{notice}</Text>}
      <Button title="Add to basket" disabled={product.stock === 0} testID="add-to-cart" onPress={() => { try { add(product); setNotice('Added to your basket.'); } catch (error) { setNotice((error as Error).message); } }} />
      <Button title="View basket" secondary onPress={() => router.push('/cart')} />
      <Button title="Report this listing" secondary onPress={() => router.push({ pathname: '/report', params: { productId: product.id } })} />
    </>}
  </Page>;
}
