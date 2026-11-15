import { StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Button, ResourceState } from "@/components/market/Primitives";
import { ListPage } from "@/components/market/ListPage";
import { ProductCard } from "@/components/market/ProductCard";
import { useProductFeed } from "@/hooks/use-product-feed";
import { useCart } from "@/lib/cart";
import { toast } from "@/lib/toast";
import type { Product, Storefront } from "@/types/marketplace";
import { palette, ui } from "@/constants/market-theme";
import { OperatingAreaLabel } from "@/components/market/OperatingAreaLabel";

export default function StoreScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const { add } = useCart();
    const resource = useProductFeed<{
        store: Storefront;
        products: Product[];
        nextCursor?: string | null;
    }>(
        `/stores/${id}?page=1&view=compact`,
        `/products?page=1&view=compact&store=${encodeURIComponent(id)}`,
    );

    function addToBasket(product: Product) {
        try {
            add(product);
        } catch (error) {
            toast.error(
                error instanceof Error
                    ? error.message
                    : "Could not add this product to your basket.",
            );
        }
    }

    return (
        <ListPage
            title="Storefront"
            back
            data={resource.data?.products || []}
            keyExtractor={(item) => item.id}
            numColumns={2}
            columnWrapperStyle={{ justifyContent: "space-between" }}
            renderItem={({ item }) => (
                <ProductCard
                    product={item}
                    onAddToBasket={addToBasket}
                    hideSellerName
                />
            )}
            onRefresh={resource.refresh}
            refreshing={resource.refreshing}
            header={
                <>
                    {resource.data && (
                        <>
                            <View style={styles.storeHero}>
                                <Text
                                    accessibilityRole="header"
                                    style={styles.storeName}
                                >
                                    {resource.data.store.name}
                                </Text>
                                <View style={styles.location}>
                                    <Text style={styles.locationLabel}>
                                        OPERATING AREA
                                    </Text>
                                    <OperatingAreaLabel
                                        area={resource.data.store.area}
                                        placeId={resource.data.store.areaPlaceId}
                                        style={styles.locationName}
                                    />
                                </View>
                                {!!resource.data.store.description && (
                                    <Text style={styles.description}>
                                        {resource.data.store.description}
                                    </Text>
                                )}
                            </View>
                            <View style={styles.productsHeading}>
                                <View style={styles.productsTitle}>
                                    <Text style={ui.heading}>
                                        Shop products
                                    </Text>
                                    <Text style={ui.small}>
                                        Available from this seller
                                    </Text>
                                </View>
                                <View style={styles.productCount}>
                                    <Text style={styles.productCountText}>
                                        {resource.data.products.length}
                                        {resource.data.nextCursor ? "+" : ""}{" "}
                                        {resource.data.products.length === 1
                                            ? "product"
                                            : "products"}
                                    </Text>
                                </View>
                            </View>
                        </>
                    )}
                    <ResourceState
                        {...resource}
                        retry={resource.refresh}
                        empty={
                            resource.data?.products.length === 0
                                ? "This seller has no products available right now."
                                : undefined
                        }
                    />
                </>
            }
            ListFooterComponent={
                resource.data?.nextCursor ? (
                    <Button
                        title={
                            resource.loadingMore
                                ? "Loading more…"
                                : "Load more products"
                        }
                        secondary
                        disabled={resource.loadingMore}
                        onPress={() => void resource.more()}
                    />
                ) : undefined
            }
        />
    );
}

const styles = StyleSheet.create({
    storeHero: {
        gap: 14,
        padding: 18,
        borderRadius: 22,
        backgroundColor: palette.brand,
    },
    productCount: {
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 16,
        backgroundColor: palette.soft,
    },
    productCountText: {
        color: palette.brand,
        fontSize: 11,
        fontWeight: "700",
    },
    storeName: {
        color: palette.paper,
        fontFamily: "serif",
        fontSize: 23,
        fontWeight: "700",
        lineHeight: 29,
    },
    location: { gap: 3 },
    locationLabel: {
        color: "#C7D6CB",
        fontSize: 9,
        fontWeight: "700",
        letterSpacing: 1,
    },
    locationName: { color: palette.paper, fontSize: 14, fontWeight: "600" },
    description: { color: "#E4ECE6", fontSize: 13, lineHeight: 19 },
    productsHeading: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingTop: 2,
        gap: 10,
    },
    productsTitle: { flex: 1, gap: 2 },
});
