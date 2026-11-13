import { useState } from 'react';
import { Text } from 'react-native';
import { Button, Page, ResourceState, SignInNotice } from '@/components/market/Primitives';
import { OrderCard } from '@/components/market/OrderCard';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useResource } from '@/hooks/use-resource';
import type { Order, OrderStatus } from '@/types/marketplace';
import { ui } from '@/constants/market-theme';

export default function SellerOrders() {
  const { session } = useAuth();
  const resource = useResource<{ orders: Order[] }>('/seller/orders', !!session);
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  async function update(id: string, status: OrderStatus) {
    if (busy) return; setBusy(true); setError('');
    try { await api(`/seller/orders/${id}`, { method: 'PUT', body: JSON.stringify({ status }) }); resource.refresh(); }
    catch (cause) { setError((cause as Error).message); } finally { setBusy(false); }
  }
  return <Page title="Incoming orders" subtitle="Keep your customers in the loop, every step of the way." back>
    {!session ? <SignInNotice /> : <><Button title="Refresh incoming orders" secondary disabled={busy} onPress={resource.refresh} /><ResourceState {...resource} retry={resource.refresh} empty={resource.data?.orders.length === 0 ? 'No incoming orders yet. Your published products are ready to be discovered.' : undefined} />{error && <Text accessibilityRole="alert" style={ui.error}>{error}</Text>}{resource.data?.orders.map(order => <OrderCard key={order.id} order={order} selling busy={busy} update={status => void update(order.id, status)} />)}</>}
  </Page>;
}
