import { Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Button, ResourceState } from "@/components/market/Primitives";
import { ListPage } from "@/components/market/ListPage";
import { ProductCard } from "@/components/market/ProductCard";
import { useProductFeed } from "@/hooks/use-product-feed";
import { useCart } from "@/lib/cart";
import { toast } from "@/lib/toast";
import type { Product, Storefront } from "@/types/marketplace";
import { ui } from "@/constants/market-theme";
import { OperatingAreaLabel } from "@/components/market/OperatingAreaLabel";

export default function StoreScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const { add } = useCart();
    const resource = useProductFeed<{
        store: Storefront;
        products: Product[];
        nextCursor?: string | null;
    }>(
        `/stores/${id}?page=1`,
        `/products?page=1&store=${encodeURIComponent(id)}`,
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
            title={resource.data?.store.name || "Local storefront"}
            back
            data={resource.data?.products || []}
            keyExtractor={(item) => item.id}
            numColumns={2}
            columnWrapperStyle={{ justifyContent: "space-between" }}
            renderItem={({ item }) => (
                <ProductCard
                    product={item}
                    onAddToBasket={addToBasket}
                />
            )}
            onRefresh={resource.refresh}
            refreshing={resource.refreshing}
            header={
                <>
                    <ResourceState
                        {...resource}
                        retry={resource.refresh}
                        empty={
                            resource.data?.products.length === 0
                                ? "No products on this page."
                                : undefined
                        }
                    />
                    {resource.data && (
                        <View style={ui.card}>
                            <OperatingAreaLabel
                                area={resource.data.store.area}
                                placeId={resource.data.store.areaPlaceId}
                                style={ui.badge}
                            />
                            <Text style={ui.body}>
                                {resource.data.store.description}
                            </Text>
                        </View>
                    )}
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
