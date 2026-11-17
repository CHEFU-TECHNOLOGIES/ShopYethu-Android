import { useLocalSearchParams } from "expo-router";
import { useRef, useState } from "react";
import { Text } from "react-native";
import { OrderCard } from "@/components/market/OrderCard";
import { Page } from "@/components/market/Page";
import { ResourceState, SignInNotice } from "@/components/market/Primitives";
import { useResource } from "@/hooks/use-resource";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { toast } from "@/lib/toast";
import type { Order, OrderStatus } from "@/types/marketplace";
import { ui } from "@/constants/market-theme";

export default function SellerOrderDetails() {
    const { id: routeId } = useLocalSearchParams<{ id: string }>();
    const id = Array.isArray(routeId) ? routeId[0] : routeId;
    const { session } = useAuth();
    const resource = useResource<{ orders: Order[] }>(
        "/seller/orders",
        !!session,
    );
    const order = resource.data?.orders.find((item) => item.id === id);
    const [loadingAction, setLoadingAction] = useState<
        "status" | "cancel" | "payment" | "collect" | null
    >(null);
    const [error, setError] = useState("");
    const locked = useRef(false);

    async function mutate(
        path: string,
        body: string,
        action: "status" | "cancel" | "payment" | "collect",
        targetStatus: OrderStatus | null = null,
    ) {
        if (!id || !order || locked.current) return;
        locked.current = true;
        setLoadingAction(action);
        setError("");
        const previous = order;
        const optimistic = targetStatus ? { ...previous, status: targetStatus } : null;
        if (optimistic) {
            resource.mutate((current) => ({
                ...current,
                orders: current.orders.map((item) => item.id === id ? optimistic : item),
            }));
        }
        try {
            await api(path, { method: "PUT", body });
        } catch (cause) {
            if (optimistic) {
                resource.mutate((current) => current.orders.some((item) => item.id === id && item === optimistic)
                    ? { ...current, orders: current.orders.map((item) => item.id === id ? previous : item) }
                    : current);
            }
            const message =
                cause instanceof Error ? cause.message : "Unable to update this order.";
            setError(message);
            toast.error(message);
        } finally {
            locked.current = false;
            setLoadingAction(null);
        }
    }

    return (
        <Page
            title="Order details"
            subtitle={order?.reference}
            back
            onRefresh={session ? resource.refresh : undefined}
            refreshing={resource.refreshing}
        >
            {!session ? (
                <SignInNotice />
            ) : (
                <>
                    <ResourceState {...resource} retry={resource.refresh} />
                    {error && (
                        <Text accessibilityRole="alert" style={ui.error}>
                            {error}
                        </Text>
                    )}
                    {order ? (
                        <OrderCard
                            order={order}
                            selling
                            busy={loadingAction !== null}
                            loadingAction={loadingAction || undefined}
                            update={(status: OrderStatus) => {
                                const action =
                                    status === "cancelled"
                                        ? "cancel"
                                        : status === "collected"
                                          ? "collect"
                                          : "status";
                                void mutate(
                                    `/seller/orders/${order.id}`,
                                    JSON.stringify({ status }),
                                    action,
                                    status,
                                );
                            }}
                            confirmPayment={() =>
                                void mutate(
                                    `/seller/orders/${order.id}/payment`,
                                    "{}",
                                    "payment",
                                )
                            }
                        />
                    ) : (
                        resource.data && (
                            <Text style={ui.subtitle}>
                                This order is no longer available.
                            </Text>
                        )
                    )}
                </>
            )}
        </Page>
    );
}
