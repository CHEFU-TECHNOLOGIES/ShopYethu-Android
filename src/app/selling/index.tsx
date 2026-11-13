import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { Button, Page, ResourceState, SignInNotice } from '@/components/market/Primitives';
import { useAuth } from '@/lib/auth';
import { useResource } from '@/hooks/use-resource';
import type { Product, SellerApplication, Storefront } from '@/types/marketplace';
import { money, statusLabel, ui } from '@/constants/market-theme';

export default function SellingScreen() {
  const { session } = useAuth();
  const account = useResource<{ application: SellerApplication | null; store: Storefront | null }>('/me', !!session);
  const allowed = account.data?.store?.status === 'active';
  const inventory = useResource<{ products: Product[] }>('/seller/store', !!session && allowed);
  return <Page title="My Store" subtitle="Your business. Your next chapter." back>
    {!session ? <SignInNotice /> : <>
      <ResourceState {...account} retry={account.refresh} />
      {account.data && !allowed && <View style={ui.card}><Text style={ui.heading}>{account.data.store ? 'Selling is suspended' : 'Seller approval required'}</Text><Text style={ui.subtitle}>{account.data.store?.reason || 'Apply to sell and wait for CheFu’s approval before managing a store.'}</Text>{account.data.application && <Text style={ui.badge}>{statusLabel(account.data.application.status)}</Text>}<Button title="View application" secondary onPress={() => router.push('/application')} /><Button title="Refresh permissions" secondary onPress={account.refresh} /></View>}
      {allowed && <>
        <View style={ui.card}><Text style={ui.heading}>{account.data!.store!.name}</Text><Text style={ui.subtitle}>{account.data!.store!.area}</Text><Text style={ui.badge}>Active seller</Text><Button title="Edit storefront" secondary onPress={() => router.push('/selling/store')} /></View>
        <Button title="Add a product" onPress={() => router.push('/selling/product')} />
        <Button title="Incoming orders" secondary onPress={() => router.push('/selling/orders')} />
        <View style={ui.between}><Text style={ui.heading}>Your products</Text><Button title="Refresh" secondary onPress={() => { account.refresh(); inventory.refresh(); }} /></View>
        <ResourceState {...inventory} retry={inventory.refresh} empty={inventory.data?.products.length === 0 ? 'Your shop is ready for its first product. Add photos, a price and stock, then publish.' : undefined} />
        {inventory.data?.products.map(product => <View key={product.id} style={ui.card}><Text style={ui.badge}>{product.published ? 'Published' : 'Draft'}</Text><Text style={ui.heading}>{product.name}</Text><Text style={ui.subtitle}>{money(product.priceCents)} · {product.stock} in stock</Text><Button title={`Edit ${product.name}`} secondary onPress={() => router.push({ pathname: '/selling/product', params: { id: product.id } })} /></View>)}
      </>}
      <Button title="Switch to shopping" secondary onPress={() => router.replace('/')} />
    </>}
  </Page>;
}
