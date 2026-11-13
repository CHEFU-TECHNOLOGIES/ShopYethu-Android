import { useLocalSearchParams } from 'expo-router';
import { Button, Page, ResourceState, SignInNotice } from '@/components/market/Primitives';
import { OrderCard } from '@/components/market/OrderCard';
import { useResource } from '@/hooks/use-resource';
import { useAuth } from '@/lib/auth';
import type { Order } from '@/types/marketplace';

export default function OrdersScreen() {
  const { session } = useAuth();
  const { refresh } = useLocalSearchParams<{ refresh?: string }>();
  const resource = useResource<{ orders: Order[] }>(`/orders?updated=${refresh || ''}`, !!session);
  return <Page title="Your orders" subtitle="Every local find, all in one place.">
    {!session ? <SignInNotice /> : <><Button title="Refresh orders" secondary onPress={resource.refresh} /><ResourceState {...resource} retry={resource.refresh} empty={resource.data?.orders.length === 0 ? 'No orders yet. Your first local find is waiting.' : undefined} />{resource.data?.orders.map(order => <OrderCard key={order.id} order={order} />)}</>}
  </Page>;
}
