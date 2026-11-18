import { useRef, useState } from "react";
import { useResource } from "@/hooks/use-resource";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { toast } from "@/lib/toast";
import type { Order, OrderStatus } from "@/types/marketplace";

export function useSellerOrderDetails(id: string | undefined) {
    const { session } = useAuth();
    const resource = useResource<{ orders: Order[] }>("/seller/orders", !!session);
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
        const updatedAt = new Date().toISOString();
        const optimistic = targetStatus
            ? {
                  ...previous,
                  status: targetStatus,
                  updatedAt,
                  history: [...previous.history, { status: targetStatus, at: updatedAt }],
              }
            : null;
        if (optimistic) {
            resource.mutate((current) => ({
                ...current,
                orders: current.orders.map((item) =>
                    item.id === id ? optimistic : item,
                ),
            }));
        }
        try {
            await api(path, { method: "PUT", body });
        } catch (cause) {
            if (optimistic) {
                resource.mutate((current) =>
                    current.orders.some(
                        (item) => item.id === id && item === optimistic,
                    )
                        ? {
                              ...current,
                              orders: current.orders.map((item) =>
                                  item.id === id ? previous : item,
                              ),
                          }
                        : current,
                );
            }
            const message =
                cause instanceof Error
                    ? cause.message
                    : "Unable to update this order.";
            setError(message);
            toast.error(message);
        } finally {
            locked.current = false;
            setLoadingAction(null);
        }
    }

    function update(status: OrderStatus) {
        if (!order) return;
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
    }

    function confirmPayment() {
        if (!order) return;
        void mutate(`/seller/orders/${order.id}/payment`, "{}", "payment");
    }

    return {
        session,
        resource,
        order,
        loadingAction,
        error,
        update,
        confirmPayment,
    };
}
