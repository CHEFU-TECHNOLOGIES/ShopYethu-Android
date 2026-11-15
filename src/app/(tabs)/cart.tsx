import { useState } from "react";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
    Button,
    Page,
    SignInNotice,
} from "@/components/market/Primitives";
import { CartCheckoutDetails } from "@/components/market/CartCheckoutDetails";
import { CartItemsSection } from "@/components/market/CartItemsSection";
import { CartLoadingState } from "@/components/market/CartLoadingState";
import { CartNotice } from "@/components/market/CartNotice";
import { CartOrderSummary } from "@/components/market/CartOrderSummary";
import { EmptyBasket } from "@/components/market/EmptyBasket";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/cart";
import { toast } from "@/lib/toast";
import type { Fulfilment } from "@/types/marketplace";

export default function CartScreen() {
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
            setError((cause as Error).message);
            toast.error((cause as Error).message);
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

    return (
        <Page
            title="Your basket"
            subtitle="Review your items and complete your order."
            onRefresh={
                session && ready && items.length > 0 && !busy && !pending
                    ? () => void refreshBasketPrices()
                    : undefined
            }
            refreshing={refreshing}
        >
            {!session ? (
                <SignInNotice />
            ) : !ready ? (
                <CartLoadingState message={basketError || undefined} />
            ) : !items.length ? (
                <EmptyBasket onBrowse={() => router.push("/")} />
            ) : (
                <>
                    {basketError && (
                        <CartNotice
                            title="Basket update"
                            message={basketError}
                            tone="warning"
                        />
                    )}
                    {pending && (
                        <CartNotice
                            title="Order awaiting confirmation"
                            message="Your last order request has not been confirmed. Confirm it using the original details before editing your basket."
                            tone="warning"
                        />
                    )}

                    <CartItemsSection
                        items={items}
                        disabled={busy || pending}
                        onChangeQuantity={updateQuantity}
                    />
                    <CartCheckoutDetails
                        fulfilment={fulfilment}
                        onSelectFulfilment={setFulfilment}
                        canCollect={items.every((item) =>
                            item.product.fulfilment.includes("collection"),
                        )}
                        contact={contact}
                        onContactChange={setContact}
                        contactPlaceholder={session.user.email}
                        address={address}
                        onAddressChange={setAddress}
                        disabled={busy || pending}
                    />
                    <CartOrderSummary
                        subtotal={subtotal}
                        collectionFee={0}
                    />

                    <CartNotice
                        title="Pay on collection"
                        message="No online payment is collected by this app."
                    />
                    {error && (
                        <CartNotice
                            title="Could not place your order"
                            message={error}
                            tone="error"
                        />
                    )}
                    {!validFulfilment && (
                        <CartNotice
                            title="Collection unavailable"
                            message="One or more items cannot be collected. Remove those items or contact the seller."
                            tone="error"
                        />
                    )}

                    <Button
                        testID="place-order"
                        title={
                            busy
                                ? "Placing order…"
                                : pending
                                  ? "Confirm previous order"
                                  : "Place order"
                        }
                        disabled={
                            busy ||
                            (!pending && !validFulfilment)
                        }
                        onPress={() => void placeOrder()}
                        trailingIcon={
                            <Ionicons
                                name={
                                    pending ? "sync-outline" : "arrow-forward"
                                }
                                size={18}
                                color="#FFFFFF"
                                accessible={false}
                            />
                        }
                    />
                </>
            )}
        </Page>
    );
}
