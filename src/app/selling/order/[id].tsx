import { useLocalSearchParams } from "expo-router";
import { Text } from "react-native";
import { OrderCard } from "@/components/market/OrderCard";
import { OrderHeaderOptions } from "@/components/market/OrderHeaderOptions";
import { OrderDetailsSkeleton } from "@/components/market/OrderDetailsSkeleton";
import { Page } from "@/components/market/Page";
import { ResourceState, SignInNotice } from "@/components/market/Primitives";
import { useSellerOrderDetails } from "@/hooks/use-seller-order-details";
import { ui } from "@/constants/market-theme";

export default function SellerOrderDetails() {
    const { id: routeId } = useLocalSearchParams<{ id: string }>();
    const id = Array.isArray(routeId) ? routeId[0] : routeId;
    const {
        session,
        resource,
        order,
        loadingAction,
        error,
        update,
        confirmPayment,
        regenerateQr,
    } = useSellerOrderDetails(id);

    return (
        <Page
            title="Order details"
            subtitle={order?.reference}
            headerRight={
                order ? (
                    <OrderHeaderOptions
                        order={order}
                        selling
                        disabled={loadingAction !== null}
                        onRegenerateQr={regenerateQr}
                    />
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
                        loadingFallback={<OrderDetailsSkeleton selling />}
                    />
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
                            update={update}
                            confirmPayment={confirmPayment}
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
