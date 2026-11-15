import { StyleSheet, Text, View } from "react-native";
import { DebouncedPressable as Pressable } from "@/components/ui/DebouncedPressable";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import type { Product } from "@/types/marketplace";
import { money, palette, ui } from "@/constants/market-theme";
import { MarketImage } from "./MarketImage";
import { prefetchProduct } from "@/lib/market-cache";

export function ProductCard({
    product,
    onAddToBasket,
    hideSellerName = false,
}: {
    product: Product & { storeName?: string };
    onAddToBasket?: (product: Product) => void;
    hideSellerName?: boolean;
}) {
    function openProduct() {
        router.navigate({
            pathname: "/product/[id]",
            params: { id: product.id },
        });
    }

    return (
        <View style={styles.card}>
            <View style={styles.imageFrame}>
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`View ${product.name}`}
                    onPressIn={() => prefetchProduct(product.id)}
                    onPress={openProduct}
                    style={styles.imagePressable}
                >
                    <MarketImage
                        uri={product.photos[0]}
                        style={styles.image}
                    />
                </Pressable>
                {onAddToBasket && (
                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`Add ${product.name} to basket`}
                        accessibilityHint="Adds one item to your basket."
                        accessibilityState={{ disabled: product.stock === 0 }}
                        disabled={product.stock === 0}
                        onPress={() => onAddToBasket(product)}
                        style={({ pressed }) => [
                            styles.addButton,
                            pressed && styles.addButtonPressed,
                            product.stock === 0 && styles.addButtonDisabled,
                        ]}
                    >
                        <Ionicons
                            name="basket-outline"
                            size={19}
                            color={palette.brand}
                            accessible={false}
                        />
                        <View style={styles.addBadge}>
                            <Ionicons
                                name="add"
                                size={11}
                                color={palette.paper}
                                accessible={false}
                            />
                        </View>
                    </Pressable>
                )}
            </View>
            <View style={styles.details}>
                {!hideSellerName &&
                    (product.storeName ? (
                        <Pressable
                            accessibilityRole="link"
                            accessibilityLabel={`Visit ${product.storeName} storefront`}
                            onPress={() =>
                                router.navigate({
                                    pathname: "/store/[id]",
                                    params: { id: product.storeId },
                                })
                            }
                            style={({ pressed }) => [
                                styles.sellerLink,
                                pressed && styles.sellerLinkPressed,
                            ]}
                        >
                            <Text style={styles.sellerName} numberOfLines={1}>
                                {product.storeName}
                            </Text>
                        </Pressable>
                    ) : (
                        <Text style={ui.small} numberOfLines={1}>
                            {product.category}
                        </Text>
                    ))}
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`${product.name}, ${money(product.priceCents)}`}
                    onPressIn={() => prefetchProduct(product.id)}
                    onPress={openProduct}
                    style={styles.productDetails}
                >
                    <Text
                        style={[ui.body, styles.productName]}
                        numberOfLines={2}
                    >
                        {product.name}
                    </Text>
                    <Text style={[ui.heading, styles.price]}>
                        {money(product.priceCents)}
                    </Text>
                    {product.stock === 0 && (
                        <Text style={ui.error}>Sold out</Text>
                    )}
                </Pressable>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    card: { width: "48%", marginBottom: 16 },
    imageFrame: {
        position: "relative",
        borderRadius: 16,
        overflow: "hidden",
        backgroundColor: palette.soft,
        aspectRatio: 0.95,
    },
    imagePressable: { width: "100%", height: "100%" },
    image: { width: "100%", height: "100%" },
    addButton: {
        position: "absolute",
        right: 8,
        bottom: 8,
        width: 38,
        height: 38,
        borderRadius: 19,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: palette.paper,
        borderWidth: 1,
        borderColor: palette.line,
        elevation: 2,
    },
    addButtonPressed: { backgroundColor: palette.soft },
    addButtonDisabled: { opacity: 0.55 },
    addBadge: {
        position: "absolute",
        top: 2,
        right: 1,
        width: 14,
        height: 14,
        borderRadius: 7,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: palette.brand,
    },
    details: { paddingTop: 10, gap: 4 },
    sellerLink: { alignSelf: "flex-start", maxWidth: "100%" },
    sellerLinkPressed: { opacity: 0.7 },
    sellerName: {
        color: palette.brand,
        fontSize: 12,
        fontWeight: "600",
        textDecorationLine: "underline",
    },
    productDetails: { gap: 4 },
    productName: { fontSize: 14, fontWeight: "600" },
    price: { fontSize: 16 },
});
