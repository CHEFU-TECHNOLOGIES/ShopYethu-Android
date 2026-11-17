import { useLocalSearchParams } from "expo-router";
import { OrderCard } from "@/components/market/OrderCard";
import { OrderSellerLink } from "@/components/market/OrderSellerLink";
import { OrderDetailsSkeleton } from "@/components/market/OrderDetailsSkeleton";
import { Page } from "@/components/market/Page";
import { ResourceState, SignInNotice } from "@/components/market/Primitives";
import { useResource } from "@/hooks/use-resource";
import { useAuth } from "@/lib/auth";
import type { Order } from "@/types/marketplace";
import { Text } from "react-native";
import { ui } from "@/constants/market-theme";
import { ProductReviewForm } from "@/components/market/ProductReviewForm";

export default function OrderDetails() {
    const { id: routeId } = useLocalSearchParams<{ id: string }>();
    const id = Array.isArray(routeId) ? routeId[0] : routeId;
    const { session } = useAuth();
    const resource = useResource<{ orders: Order[] }>("/orders", !!session);
    const order = resource.data?.orders.find((item) => item.id === id);
    const canReview =
        order?.status === "completed" || order?.status === "collected";
    const reviewState = useResource<{ reviewedProductIds: string[] }>(
        `/orders/${encodeURIComponent(id || "")}/reviews`,
        !!session && !!id && canReview,
    );

    function markReviewed(productId: string) {
        reviewState.mutate((current) => ({
            ...current,
            reviewedProductIds: [...new Set([...current.reviewedProductIds, productId])],
        }));
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
                    <ResourceState
                        {...resource}
                        retry={resource.refresh}
                        loadingFallback={<OrderDetailsSkeleton />}
                    />
                    {order ? (
                        <>
                            <OrderSellerLink storeId={order.storeId} />
                            <OrderCard order={order} />
                            {(order.status === "completed" ||
                                order.status === "collected") &&
                                (reviewState.data ? (
                                    <>
                                        {order.items
                                            .filter(
                                                (item) =>
                                                    !reviewState.data?.reviewedProductIds.includes(
                                                        item.productId,
                                                    ),
                                            )
                                            .map((item) => (
                                                <ProductReviewForm
                                                    key={item.productId}
                                                    orderId={order.id}
                                                    productId={item.productId}
                                                    productName={item.name}
                                                    onSubmitted={markReviewed}
                                                />
                                            ))}
                                        {order.items.every((item) =>
                                            reviewState.data?.reviewedProductIds.includes(
                                                item.productId,
                                            ),
                                        ) && (
                                            <Text style={ui.subtitle}>
                                                Thanks for sharing your verified product reviews.
                                            </Text>
                                        )}
                                    </>
                                ) : (
                                    <ResourceState
                                        {...reviewState}
                                        retry={reviewState.refresh}
                                    />
                                ))}
                        </>
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
