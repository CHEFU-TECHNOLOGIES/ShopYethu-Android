import { ListPage } from "@/components/market/ListPage";
import { ResourceState, SignInNotice } from "@/components/market/Primitives";
import { OrderListRow } from "@/components/market/OrderListRow";
import { OrdersSkeleton } from "@/components/market/OrdersSkeleton";
import { useAuth } from "@/lib/auth";
import { useResource } from "@/hooks/use-resource";
import type { Order } from "@/types/marketplace";
import { router } from "expo-router";
import { Text, View } from "react-native";
import { ui } from "@/constants/market-theme";

export default function SellerOrders() {
    const { session } = useAuth();
    const resource = useResource<{ orders: Order[] }>(
        "/seller/orders",
        !!session,
    );
    const orders = session ? resource.data?.orders || [] : [];

    return (
        <ListPage
            title="Incoming orders"
            back
            data={orders}
            keyExtractor={(order) => order.id}
            renderItem={({ item }) => (
                <OrderListRow
                    order={item}
                    onPress={() =>
                        router.navigate({
                            pathname: "/selling/order/[id]",
                            params: { id: item.id },
                        })
                    }
                />
            )}
            onRefresh={session ? resource.refresh : undefined}
            refreshing={resource.refreshing}
            header={
                <View style={{ gap: 12 }}>
                    <Text style={ui.subtitle}>
                        Keep your customers in the loop, every step of the way.
                    </Text>
                    {!session ? (
                        <SignInNotice />
                    ) : (
                    <ResourceState
                        {...resource}
                        retry={resource.refresh}
                        loadingFallback={<OrdersSkeleton />}
                        empty={
                            resource.data?.orders.length === 0
                                ? "No incoming orders yet. Your published products are ready to be discovered."
                                : undefined
                        }
                    />
                    )}
                </View>
            }
        />
    );
}
