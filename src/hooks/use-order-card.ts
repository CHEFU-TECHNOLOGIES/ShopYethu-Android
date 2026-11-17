import { useState } from "react";
import { router } from "expo-router";
import type { Order, OrderStatus } from "@/types/marketplace";

export function useOrderCard(order: Order, selling: boolean) {
    const [historyExpanded, setHistoryExpanded] = useState(true);
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

    function reportOrder() {
        router.navigate({
            pathname: "/report",
            params: { orderId: order.id },
        });
    }

    return {
        next,
        nextAction,
        canCancel,
        historyExpanded,
        setHistoryExpanded,
        reportOrder,
    };
}
