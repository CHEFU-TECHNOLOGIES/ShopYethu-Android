import { useState } from "react";
import { Text, View } from "react-native";
import { DebouncedPressable as Pressable } from "@/components/ui/DebouncedPressable";
import { router } from "expo-router";
import type { Order, OrderStatus } from "@/types/marketplace";
import { money, statusLabel, ui } from "@/constants/market-theme";
import { Button } from "./Primitives";
import { ReportLink } from "./ReportLink";
import { OrderStatusBadge } from "./OrderStatusBadge";

export function OrderCard({
    order,
    selling = false,
    busy = false,
    loadingAction,
    update,
    confirmPayment,
}: {
    order: Order;
    selling?: boolean;
    busy?: boolean;
    loadingAction?: "status" | "cancel" | "payment" | "collect";
    update?: (status: OrderStatus) => void;
    confirmPayment?: () => void;
}) {
    const next: OrderStatus | null = (
        {
            placed: "accepted",
            accepted: "preparing",
            preparing:
                order.fulfilment === "collection" ? "ready" : "dispatched",
            ready: null,
            dispatched: "completed",
            completed: null,
            collected: null,
            cancelled: null,
        } as Record<OrderStatus, OrderStatus | null>
    )[order.status];
    const nextAction: Partial<Record<OrderStatus, string>> = {
        placed: "Accept order",
        accepted: "Start preparing",
        preparing:
            order.fulfilment === "collection"
                ? "Ready for collection"
                : "Mark as dispatched",
        dispatched: "Complete order",
    };
    const canCancel = selling && ["placed", "accepted"].includes(order.status);
    const [historyExpanded, setHistoryExpanded] = useState(true);
    return (
        <View style={ui.card}>
            <View style={ui.between}>
                <Text style={ui.heading}>{order.reference}</Text>
                <OrderStatusBadge status={order.status} />
            </View>
            {order.fulfilment === 'collection' && !['cancelled', 'collected', 'completed'].includes(order.status) && (
                <Text style={ui.small}>
                    {selling ? 'Match this order code with the customer at collection.' : 'Show this order code to your seller when collecting. Wait until your order is ready.'}
                </Text>
            )}
            <Text style={ui.small}>
                {new Date(order.createdAt).toLocaleString("en-ZA")}
            </Text>
            {order.items.map((item) => (
                <View key={item.productId} style={ui.between}>
                    <Text style={[ui.body, { flex: 1 }]}>
                        {item.quantity} × {item.name}
                    </Text>
                    <Text style={ui.body}>
                        {money(item.priceCents * item.quantity)}
                    </Text>
                </View>
            ))}
            <Text style={ui.heading}>{money(order.totalCents)}</Text>
            <Text style={ui.subtitle}>
                {order.fulfilment === "collection"
                    ? "Collection from the seller"
                    : "Local delivery"}
                {order.address ? ` · ${order.address}` : ""}
            </Text>
            <View style={ui.between}>
                <Text style={ui.small}>Payment</Text>
                <Text style={ui.small}>
                    {order.paymentStatus === "paid-on-collection"
                        ? "Confirmed by seller"
                        : "Due at collection"}
                </Text>
            </View>
            <Text style={ui.small}>{order.paymentNote}</Text>
            {order.paymentReceivedAt && (
                <Text style={ui.small}>
                    Payment confirmed{" "}
                    {new Date(order.paymentReceivedAt).toLocaleString("en-ZA")}
                </Text>
            )}
            {selling && (
                <Text style={ui.body}>Customer contact: {order.contact}</Text>
            )}
            <View style={ui.divider} />
            <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${historyExpanded ? "Collapse" : "Expand"} order updates`}
                accessibilityState={{ expanded: historyExpanded }}
                onPress={() => setHistoryExpanded((expanded) => !expanded)}
                style={ui.between}
            >
                <Text style={[ui.body, { fontWeight: "700" }]}>
                    Order updates ({order.history.length})
                </Text>
                <Text style={ui.badge}>
                    {historyExpanded ? "Hide" : "Show"}
                </Text>
            </Pressable>
            {historyExpanded &&
                order.history.map((event, index) => (
                    <Text key={`${event.at}-${index}`} style={ui.small}>
                        • {statusLabel(event.status)} ·{" "}
                        {new Date(event.at).toLocaleString("en-ZA")}
                    </Text>
                ))}
            {selling && (
                <View style={{ gap: 10, marginTop: 4 }}>
                    {next && (
                        <Button
                            title={nextAction[order.status] || `Mark ${statusLabel(next)}`}
                            disabled={busy}
                            compact
                            loading={loadingAction === "status"}
                            onPress={() => update?.(next)}
                        />
                    )}
                    {order.status === "ready" &&
                        order.paymentStatus !== "paid-on-collection" && (
                            <Button
                                title="Confirm payment received"
                                disabled={busy}
                                compact
                                loading={loadingAction === "payment"}
                                onPress={() => confirmPayment?.()}
                            />
                        )}
                    {order.status === "ready" &&
                        order.paymentStatus === "paid-on-collection" && (
                            <Button
                                title="Mark as collected"
                                disabled={busy}
                                compact
                                loading={loadingAction === "collect"}
                                onPress={() => update?.("collected")}
                            />
                        )}
                    <View style={{ flexDirection: "row", gap: 8 }}>
                        {canCancel && (
                            <Button
                                title="Cancel order"
                                tone="danger"
                                compact
                                inline
                                disabled={busy}
                                loading={loadingAction === "cancel"}
                                onPress={() => update?.("cancelled")}
                            />
                        )}
                        <ReportLink
                            title="Report order issue"
                            inline={canCancel}
                            disabled={busy}
                            onPress={() =>
                                router.navigate({
                                    pathname: "/report",
                                    params: { orderId: order.id },
                                })
                            }
                        />
                    </View>
                </View>
            )}
            {!selling && (
                <ReportLink
                    title="Raise an order issue"
                    onPress={() =>
                        router.navigate({
                            pathname: "/report",
                            params: { orderId: order.id },
                        })
                    }
                />
            )}
        </View>
    );
}
