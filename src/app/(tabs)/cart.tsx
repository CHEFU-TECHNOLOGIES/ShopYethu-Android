import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Button, Page, SignInNotice } from "@/components/market/Primitives";
import { CartCheckoutDetails } from "@/components/market/CartCheckoutDetails";
import { CartAlternativeBaskets } from "@/components/market/CartAlternativeBaskets";
import { CartItemsSection } from "@/components/market/CartItemsSection";
import { CartLoadingState } from "@/components/market/CartLoadingState";
import { CartNotice } from "@/components/market/CartNotice";
import { CartOrderSummary } from "@/components/market/CartOrderSummary";
import { EmptyBasket } from "@/components/market/EmptyBasket";
import { useCartScreen } from "@/hooks/use-cart-screen";

export default function CartScreen() {
    const {
        session,
        items,
        alternates,
        updateQuantity,
        switchBasket,
        ready,
        error: basketError,
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
        containsOwnProducts,
        placeOrder,
        refreshBasketPrices,
    } = useCartScreen();

    return (
        <Page
            title="Your basket"
            subtitle="Review your items and complete your order."
            onRefresh={
                ready && items.length > 0 && !busy && !pending
                    ? () => void refreshBasketPrices()
                    : undefined
            }
            refreshing={refreshing}
        >
            {!ready ? (
                <CartLoadingState error={basketError || undefined} />
            ) : !items.length && !alternates.length ? (
                <EmptyBasket onBrowse={() => router.navigate("/")} />
            ) : (
                <>
                    <CartAlternativeBaskets
                        baskets={alternates}
                        disabled={busy || pending}
                        onSwitch={switchBasket}
                    />
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

                    {items.length > 0 ? (
                        <>
                            <CartItemsSection
                                items={items}
                                disabled={busy || pending}
                                onChangeQuantity={updateQuantity}
                            />
                            <CartOrderSummary
                                subtotal={subtotal}
                                collectionFee={0}
                            />
                        </>
                    ) : (
                        <EmptyBasket onBrowse={() => router.navigate("/")} />
                    )}

                    {items.length > 0 && session ? (
                        <>
                            <CartCheckoutDetails
                                fulfilment={fulfilment}
                                onSelectFulfilment={setFulfilment}
                                canCollect={items.every((item) =>
                                    item.product.fulfilment.includes(
                                        "collection",
                                    ),
                                )}
                                contact={contact}
                                onContactChange={setContact}
                                contactPlaceholder={session.user.email}
                                address={address}
                                onAddressChange={setAddress}
                                disabled={busy || pending}
                            />
                            <CartNotice
                                title="Pay on collection"
                                message="No online payment is collected by this app."
                            />
                            {containsOwnProducts && !pending && (
                                <CartNotice
                                    title="Your own product"
                                    message="Remove products from your own store before placing this order."
                                    tone="error"
                                />
                            )}
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
                                    (!pending &&
                                        (!validFulfilment ||
                                            containsOwnProducts))
                                }
                                onPress={() => void placeOrder()}
                                trailingIcon={
                                    <Ionicons
                                        name={
                                            pending
                                                ? "sync-outline"
                                                : "arrow-forward"
                                        }
                                        size={18}
                                        color="#FFFFFF"
                                        accessible={false}
                                    />
                                }
                            />
                        </>
                    ) : items.length > 0 ? (
                        <SignInNotice
                            title="Ready to check out?"
                            subtitle="Sign in to place your order. Your basket is saved on this device."
                        />
                    ) : null}
                </>
            )}
        </Page>
    );
}
