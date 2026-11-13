import { Text, View } from 'react-native';
import { router } from 'expo-router';
import type { Order, OrderStatus } from '@/types/marketplace';
import { money, statusLabel, ui } from '@/constants/market-theme';
import { Button } from './Primitives';

export function OrderCard({ order, selling = false, busy = false, update }: { order: Order; selling?: boolean; busy?: boolean; update?: (status: OrderStatus) => void }) {
  const next: OrderStatus | null = ({ placed: 'accepted', accepted: 'preparing', preparing: order.fulfilment === 'collection' ? 'ready' : 'dispatched', ready: 'completed', dispatched: 'completed', completed: null, cancelled: null } as Record<OrderStatus, OrderStatus | null>)[order.status];
  return <View style={ui.card}>
    <View style={ui.between}><Text style={ui.heading}>{order.reference}</Text><Text style={ui.badge}>{statusLabel(order.status)}</Text></View>
    <Text style={ui.small}>{new Date(order.createdAt).toLocaleString('en-ZA')}</Text>
    {order.items.map(item => <View key={item.productId} style={ui.between}><Text style={[ui.body, { flex: 1 }]}>{item.quantity} × {item.name}</Text><Text style={ui.body}>{money(item.priceCents * item.quantity)}</Text></View>)}
    <Text style={ui.heading}>{money(order.totalCents)}</Text>
    <Text style={ui.subtitle}>{order.fulfilment === 'collection' ? 'Collection from the seller' : 'Local delivery'}{order.address ? ` · ${order.address}` : ''}</Text>
    <Text style={ui.small}>{order.paymentNote}</Text>
    {selling && <Text style={ui.body}>Customer contact: {order.contact}</Text>}
    <View style={ui.divider} />
    {order.history.map((event, index) => <Text key={`${event.at}-${index}`} style={ui.small}>• {statusLabel(event.status)} · {new Date(event.at).toLocaleString('en-ZA')}</Text>)}
    {selling && next && <Button title={`Mark ${statusLabel(next).toLowerCase()}`} disabled={busy} onPress={() => update?.(next)} />}
    {selling && ['placed', 'accepted'].includes(order.status) && <Button title="Cancel order and restore stock" secondary disabled={busy} onPress={() => update?.('cancelled')} />}
    <Button title="Raise an order issue" secondary onPress={() => router.push({ pathname: '/report', params: { orderId: order.id } })} />
  </View>;
}
