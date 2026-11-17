import { ResourceState, SignInNotice } from "@/components/market/Primitives";
import { ListPage } from "@/components/market/ListPage";
import { OrderListRow } from "@/components/market/OrderListRow";
import { OrdersSkeleton } from "@/components/market/OrdersSkeleton";
import { OrdersEmptyState } from "@/components/market/OrdersEmptyState";
import { useResource } from "@/hooks/use-resource";
import { useAuth } from "@/lib/auth";
import type { Order } from "@/types/marketplace";
import { router } from "expo-router";
import { Text } from "react-native";
import { ui } from "@/constants/market-theme";

export default function OrdersScreen() {
    const { session } = useAuth();
    const resource = useResource<{ orders: Order[] }>("/orders", !!session);
    return (
        <ListPage
            title="Your orders"
            data={session ? resource.data?.orders || [] : []}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
                <OrderListRow
                    order={item}
                    onPress={() =>
                        router.navigate({
                            pathname: "/order/[id]",
                            params: { id: item.id },
                        })
                    }
                />
            )}
            onRefresh={session ? resource.refresh : undefined}
            refreshing={resource.refreshing}
            ListEmptyComponent={
                session && resource.data?.orders.length === 0 ? (
                    <OrdersEmptyState onBrowse={() => router.navigate("/")} />
                ) : undefined
            }
            header={
                !session ? (
                    <SignInNotice />
                ) : (
                    <>
                        <Text style={ui.subtitle}>
                            Keep track of your purchases, status, and collection
                            details.
                        </Text>
                        <ResourceState
                            {...resource}
                            retry={resource.refresh}
                            loadingFallback={<OrdersSkeleton />}
                        />
                    </>
                )
            }
        />
    );
}
