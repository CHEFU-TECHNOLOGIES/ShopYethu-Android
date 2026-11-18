import { useLocalSearchParams } from "expo-router";
import { OrderCard } from "@/components/market/OrderCard";
import { OrderSellerLink } from "@/components/market/OrderSellerLink";
import { OrderHeaderOptions } from "@/components/market/OrderHeaderOptions";
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
    const { id: routeId, qrToken: routeQrToken } = useLocalSearchParams<{
        id: string;
        qrToken?: string;
    }>();
    const id = Array.isArray(routeId) ? routeId[0] : routeId;
    const qrToken = Array.isArray(routeQrToken)
        ? routeQrToken[0]
        : routeQrToken;
    const { session } = useAuth();
    const resource = useResource<Order>(
        `/orders/${encodeURIComponent(id || "")}${
            qrToken ? `?qrToken=${encodeURIComponent(qrToken)}` : ""
        }`,
        !!session && !!id,
    );
    const order = resource.data;
    const canReview =
        !!order &&
        order.buyerUid === session?.user.uid &&
        (order.status === "completed" || order.status === "collected");
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
            headerRight={
                order ? (
                    <OrderHeaderOptions order={order} selling={false} />
                ) : undefined
            }
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
