import { useState } from "react";
import { router } from "expo-router";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/cart";
import { toast } from "@/lib/toast";
import type { Fulfilment } from "@/types/marketplace";

export function useCartScreen() {
    const { session } = useAuth();
    const {
        items,
        quantity: updateQuantity,
        checkout,
        refreshPrices,
        ready,
        error: basketError,
        pending,
    } = useCart();
    const [fulfilment, setFulfilment] = useState<Fulfilment>("collection");
    const [contact, setContact] = useState("");
    const [address, setAddress] = useState("");
    const [busy, setBusy] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");
    const subtotal = items.reduce(
        (sum, item) => sum + item.product.priceCents * item.quantity,
        0,
    );
    const validFulfilment = items.every((item) =>
        item.product.fulfilment.includes(fulfilment),
    );

    async function placeOrder() {
        if (busy) return;
        setBusy(true);
        setError("");
        try {
            const order = await checkout(
                fulfilment,
                contact || session?.user.email || "",
                address,
            );
            router.replace({
                pathname: "/orders",
                params: { refresh: order.id },
            });
        } catch (cause) {
            const message =
                cause instanceof Error
                    ? cause.message
                    : "Could not place your order. Please try again.";
            setError(message);
            toast.error(message);
        } finally {
            setBusy(false);
        }
    }

    async function refreshBasketPrices() {
        if (refreshing || busy || pending || !ready || !items.length) return;
        setRefreshing(true);
        try {
            await refreshPrices();
        } catch (cause) {
            toast.error(
                cause instanceof Error
                    ? cause.message
                    : "Could not refresh prices and availability.",
            );
        } finally {
            setRefreshing(false);
        }
    }

    return {
        session,
        items,
        updateQuantity,
        ready,
        basketError,
        pending,
        fulfilment,
        setFulfilment,
        contact,
        setContact,
        address,
        setAddress,
        busy,
        refreshing,
        error,
        subtotal,
        validFulfilment,
        placeOrder,
        refreshBasketPrices,
    };
}
