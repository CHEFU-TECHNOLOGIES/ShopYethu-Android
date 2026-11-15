import { ResourceState, SignInNotice } from "@/components/market/Primitives";
import { ListPage } from "@/components/market/ListPage";
import { OrderListRow } from "@/components/market/OrderListRow";
import { useResource } from "@/hooks/use-resource";
import { useAuth } from "@/lib/auth";
import type { Order } from "@/types/marketplace";
import { router } from "expo-router";

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
            header={
                !session ? (
                    <SignInNotice />
                ) : (
                    <ResourceState
                        {...resource}
                        retry={resource.refresh}
                        empty={
                            resource.data?.orders.length === 0
                                ? "No orders yet. Your first local find is waiting."
                                : undefined
                        }
                    />
                )
            }
        />
    );
}
