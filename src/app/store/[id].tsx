import { useLocalSearchParams } from "expo-router";
import { Button, ResourceState } from "@/components/market/Primitives";
import { ListPage } from "@/components/market/ListPage";
import { ProductCard } from "@/components/market/ProductCard";
import { StorefrontHeader } from "@/components/market/StorefrontHeader";
import { StorefrontSkeleton } from "@/components/market/StorefrontSkeleton";
import { useProductFeed } from "@/hooks/use-product-feed";
import { useCart } from "@/lib/cart";
import { toast } from "@/lib/toast";
import type { Product, Storefront } from "@/types/marketplace";

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
                        <StorefrontHeader
                            store={resource.data.store}
                            productCount={resource.data.products.length}
                            hasMore={!!resource.data.nextCursor}
                        />
                    )}
                    <ResourceState
                        {...resource}
                        retry={resource.refresh}
                        loadingFallback={<StorefrontSkeleton />}
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
