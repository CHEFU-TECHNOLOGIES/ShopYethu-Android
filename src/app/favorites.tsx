import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Button } from "@/components/market/Primitives";
import { ListPage } from "@/components/market/ListPage";
import { ProductCard } from "@/components/market/ProductCard";
import { palette, ui } from "@/constants/market-theme";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/cart";
import { productForUse } from "@/lib/product-cache";
import { useWishlist } from "@/lib/wishlist";
import type { Product } from "@/types/marketplace";

type WishlistProduct = Product & {
    storeName?: string;
    storeVerified?: boolean;
};

export default function FavoritesScreen() {
    const { session } = useAuth();
    const { add } = useCart();
    const wishlist = useWishlist();
    const [products, setProducts] = useState<WishlistProduct[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadError, setLoadError] = useState("");
    const loadVersion = useRef(0);

    const loadProducts = useCallback(
        async (force = false) => {
            const version = ++loadVersion.current;
            if (!wishlist.ready || !wishlist.productIds.length) return;

            setLoading(true);
            setLoadError("");
            const results = await Promise.allSettled(
                wishlist.productIds.map((id) => productForUse(id, force)),
            );
            if (version !== loadVersion.current) return;

            const nextProducts: WishlistProduct[] = [];
            let unavailable = 0;
            for (const result of results) {
                if (result.status === "fulfilled") {
                    nextProducts.push(result.value);
                } else {
                    unavailable += 1;
                }
            }
            setProducts(nextProducts);
            setLoading(false);
            if (unavailable) {
                setLoadError(
                    `${unavailable} saved product${unavailable === 1 ? " is" : "s are"} unavailable. Refresh to try again.`,
                );
            }
        },
        [wishlist.productIds, wishlist.ready],
    );

    useEffect(() => {
        const timer = setTimeout(() => void loadProducts(), 0);
        return () => {
            clearTimeout(timer);
            loadVersion.current += 1;
        };
    }, [loadProducts]);

    const listLoading =
        wishlist.ready && wishlist.productIds.length > 0 && loading;
    const activeLoadError =
        wishlist.ready && wishlist.productIds.length > 0 ? loadError : "";
    const visibleProducts = products.filter((product) =>
        wishlist.productIds.includes(product.id),
    );
    const emptyContent = wishlist.error ? (
        <View style={styles.empty}>
            <Text accessibilityRole="alert" style={ui.error}>
                {wishlist.error}
            </Text>
            <Button title="Try again" secondary onPress={wishlist.retry} />
        </View>
    ) : !wishlist.ready || listLoading ? (
        <View style={styles.loading}>
            <ActivityIndicator color={palette.brand} />
            <Text style={ui.subtitle}>Loading your wishlist…</Text>
        </View>
    ) : wishlist.productIds.length === 0 ? (
        <View style={styles.empty}>
            <View style={styles.emptyIcon}>
                <Ionicons
                    name="heart-outline"
                    size={34}
                    color={palette.brand}
                    accessible={false}
                />
            </View>
            <Text style={ui.heading}>Your wishlist is empty</Text>
            <Text style={[ui.subtitle, styles.emptyCopy]}>
                Tap the heart on a product to save it here.
            </Text>
            <Button
                title="Browse products"
                onPress={() => router.navigate("/")}
            />
        </View>
    ) : loadError ? (
        <View style={styles.empty}>
            <Text style={ui.subtitle}>Your saved products could not be loaded.</Text>
            <Button
                title="Retry"
                secondary
                onPress={() => void loadProducts(true)}
            />
        </View>
    ) : null;

    return (
        <ListPage
            title="Wishlist"
            back
            data={visibleProducts}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
                <ProductCard
                    product={item}
                    onAddToBasket={
                        session?.user.uid === item.ownerUid ? undefined : add
                    }
                />
            )}
            numColumns={2}
            columnWrapperStyle={styles.productRow}
            onRefresh={
                wishlist.ready ? () => void loadProducts(true) : undefined
            }
            refreshing={listLoading}
            header={
                <View style={styles.header}>
                    <Text style={ui.subtitle}>
                        Products you’ve saved for later.
                    </Text>
                    {activeLoadError ? (
                        <Text
                            accessibilityRole="alert"
                            style={ui.error}
                        >
                            {activeLoadError}
                        </Text>
                    ) : null}
                </View>
            }
            ListEmptyComponent={emptyContent || undefined}
        />
    );
}

const styles = StyleSheet.create({
    header: { gap: 8 },
    productRow: { justifyContent: "space-between" },
    loading: {
        alignItems: "center",
        gap: 12,
        paddingVertical: 36,
    },
    empty: {
        alignItems: "center",
        gap: 14,
        paddingHorizontal: 20,
        paddingVertical: 36,
    },
    emptyIcon: {
        width: 76,
        height: 76,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 26,
        backgroundColor: palette.soft,
    },
    emptyCopy: { textAlign: "center" },
});
