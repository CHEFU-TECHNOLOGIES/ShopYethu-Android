import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Button, Field, Page, ResourceState, SignInNotice } from '@/components/market/Primitives';
import { useCart } from '@/lib/cart';
import { useAuth } from '@/lib/auth';

import { useResource } from '@/hooks/use-resource';
import type { Fulfilment } from '@/types/marketplace';
import { money, ui } from '@/constants/market-theme';

export default function CartScreen() {
  const { session } = useAuth();
  const { items, quantity, checkout, refreshPrices } = useCart();
  const config = useResource<{ collectionEnabled: boolean; deliveryCents: number }>('/config');
  const [fulfilment, setFulfilment] = useState<Fulfilment>('collection');
  const [contact, setContact] = useState(''), [address, setAddress] = useState(''), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const subtotal = items.reduce((sum, item) => sum + item.product.priceCents * item.quantity, 0);
  const delivery = fulfilment === 'local-delivery' ? config.data?.deliveryCents || 0 : 0;
  const validFulfilment = items.every(item => item.product.fulfilment.includes(fulfilment));
  async function place() {
    if (busy) return;
    setBusy(true); setError('');
    try {
      const order = await checkout(fulfilment, contact || session?.user.email || '', address);
      router.replace({ pathname: '/orders', params: { refresh: order.id } });
    } catch (cause) { setError((cause as Error).message); }
    finally { setBusy(false); }
  }
  return <Page title="Your basket" subtitle="A few good things, from a local business.">
    {!session ? <SignInNotice /> : !items.length ? <View style={ui.card}><Text style={ui.heading}>Room for something lovely</Text><Text style={ui.subtitle}>Your basket is empty. Explore what your neighbourhood has to offer.</Text><Button title="Explore products" onPress={() => router.push('/')} /></View> : <>
      {items.map(({ product, quantity: count }) => <View key={product.id} style={ui.card}><Text style={ui.heading}>{product.name}</Text><Text style={ui.subtitle}>{money(product.priceCents)} each</Text><View style={ui.between}><Button title="−" secondary disabled={busy} onPress={() => quantity(product.id, count - 1)} /><Text style={ui.heading}>{count}</Text><Button title="+" secondary disabled={busy || count >= product.stock} onPress={() => quantity(product.id, count + 1)} /><Text style={ui.body}>{money(product.priceCents * count)}</Text></View></View>)}
      <Text style={ui.heading}>How would you like it?</Text>
      <View style={ui.row}>{(['collection'] as Fulfilment[]).map(option => <Pressable key={option} disabled={busy || !items.every(item => item.product.fulfilment.includes(option))} onPress={() => setFulfilment(option)} style={[ui.pill, fulfilment === option && ui.pillActive]}><Text style={fulfilment === option ? ui.buttonText : ui.body}>{option === 'collection' ? 'Collection' : 'Local delivery'}</Text></Pressable>)}</View>
      <Field label="Contact email or phone" value={contact} onChangeText={setContact} placeholder={session.user.email} editable={!busy} />
      <Field label={fulfilment === 'collection' ? 'Collection instructions (optional)' : 'Delivery address'} value={address} onChangeText={setAddress} multiline editable={!busy} />
      <View style={ui.card}><View style={ui.between}><Text style={ui.body}>Products</Text><Text style={ui.body}>{money(subtotal)}</Text></View><View style={ui.between}><Text style={ui.body}>{fulfilment === 'collection' ? 'Collection' : 'Delivery fee'}</Text><Text style={ui.body}>{money(delivery)}</Text></View><View style={ui.divider} /><View style={ui.between}><Text style={ui.heading}>Estimated total</Text><Text style={ui.heading}>{money(subtotal + delivery)}</Text></View><Text style={ui.small}>Price, stock, seller availability and fulfilment are checked again when you place the order.</Text></View>
      <ResourceState {...config} retry={config.refresh} />
      {!config.data?.collectionEnabled && <Text style={ui.error}>Marketplace payment and fulfilment rules are not configured yet. Live ordering is unavailable.</Text>}
      <Text style={ui.subtitle}>{config.data?.collectionEnabled ? 'Pay on collection. No online payment is collected by this app.' : 'Ordering is unavailable until marketplace payment and fulfilment rules are enabled.'}</Text>
      {error && <Text accessibilityRole="alert" style={ui.error}>{error}</Text>}
      {!validFulfilment && <Text style={ui.error}>Choose a fulfilment option supported by every product.</Text>}
      <Button testID="place-order" title={busy ? 'Placing order…' : 'Place order · pay on collection'} disabled={busy || !config.data?.collectionEnabled || !validFulfilment} onPress={() => void place()} />
      <Button title="Refresh prices and availability" secondary disabled={busy} onPress={() => void refreshPrices().catch(cause => setError(cause.message))} />
    </>}
  </Page>;
}
