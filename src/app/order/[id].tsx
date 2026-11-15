import { useLocalSearchParams } from "expo-router";
import { OrderCard } from "@/components/market/OrderCard";
import { OrderSellerLink } from "@/components/market/OrderSellerLink";
import { Page } from "@/components/market/Page";
import { ResourceState, SignInNotice } from "@/components/market/Primitives";
import { useResource } from "@/hooks/use-resource";
import { useAuth } from "@/lib/auth";
import type { Order } from "@/types/marketplace";
import { Text } from "react-native";
import { ui } from "@/constants/market-theme";

export default function OrderDetails() {
    const { id: routeId } = useLocalSearchParams<{ id: string }>();
    const id = Array.isArray(routeId) ? routeId[0] : routeId;
    const { session } = useAuth();
    const resource = useResource<{ orders: Order[] }>("/orders", !!session);
    const order = resource.data?.orders.find((item) => item.id === id);

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
                    {order ? (
                        <>
                            <OrderSellerLink storeId={order.storeId} />
                            <OrderCard order={order} />
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
