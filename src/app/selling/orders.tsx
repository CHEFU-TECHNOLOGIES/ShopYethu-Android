import { useState } from "react";
import { ListPage } from "@/components/market/ListPage";
import { ResourceState, SignInNotice } from "@/components/market/Primitives";
import { OrderListRow } from "@/components/market/OrderListRow";
import { OrdersSkeleton } from "@/components/market/OrdersSkeleton";
import { ClearableTextInput } from "@/components/market/ClearableTextInput";
import { useAuth } from "@/lib/auth";
import { useResource } from "@/hooks/use-resource";
import type { Order } from "@/types/marketplace";
import { router } from "expo-router";
import { Text, View } from "react-native";
import { palette, ui } from "@/constants/market-theme";

export default function SellerOrders() {
    const { session } = useAuth();
    const [search, setSearch] = useState("");
    const resource = useResource<{ orders: Order[] }>(
        "/seller/orders",
        !!session,
    );
    const orders = session ? resource.data?.orders || [] : [];
    const query = search.trim().toLowerCase();
    const visibleOrders = query
        ? orders.filter((order) =>
              `${order.reference} ${order.contact} ${order.items
                  .map((item) => item.name)
                  .join(" ")}`
                  .toLowerCase()
                  .includes(query),
          )
        : orders;

    return (
        <ListPage
            title="Incoming orders"
            back
            data={visibleOrders}
            keyExtractor={(order) => order.id}
            ListEmptyComponent={
                query && orders.length > 0 ? (
                    <Text style={ui.subtitle}>
                        No orders match your search.
                    </Text>
                ) : undefined
            }
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
                    {/**TODO Uncomment on a big version release */}
                    {/* <Text style={ui.subtitle}>
                        Keep your customers in the loop, every step of the way.
                    </Text> */}
                    {!session ? (
                        <SignInNotice />
                    ) : (
                        <>
                            <ClearableTextInput
                                accessibilityLabel="Search orders"
                                clearLabel="order search"
                                placeholder="Order number, product, or customer contact"
                                placeholderTextColor={palette.muted}
                                value={search}
                                onChangeText={setSearch}
                                style={ui.input}
                                returnKeyType="search"
                                autoCorrect={false}
                            />
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
                        </>
                    )}
                </View>
            }
        />
    );
}
