import { Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Page, ResourceState } from '@/components/market/Primitives';
import { ProductCard } from '@/components/market/ProductCard';
import { useResource } from '@/hooks/use-resource';
import type { Product, Storefront } from '@/types/marketplace';
import { ui } from '@/constants/market-theme';

export default function StoreScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const resource = useResource<{ store: Storefront; products: Product[] }>(`/stores/${id}`);
  return <Page title={resource.data?.store.name || 'Local storefront'} back>
    <ResourceState {...resource} retry={resource.refresh} empty={resource.data?.products.length === 0 ? 'This store has no published products yet.' : undefined} />
    {resource.data && <><View style={ui.card}><Text style={ui.badge}>{resource.data.store.area}</Text><Text style={ui.body}>{resource.data.store.description}</Text></View><View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>{resource.data.products.map(product => <ProductCard key={product.id} product={product} />)}</View></>}
  </Page>;
}
