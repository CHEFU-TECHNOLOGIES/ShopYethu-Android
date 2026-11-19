import { StyleSheet, Text, View } from "react-native";
import { DebouncedPressable as Pressable } from "@/components/ui/DebouncedPressable";
import { router } from "expo-router";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import type { Product } from "@/types/marketplace";
import { money, palette, ui } from "@/constants/market-theme";
import { MarketImage } from "./MarketImage";
import { prefetchProduct } from "@/lib/market-cache";
import { useCart } from "@/lib/cart";
import { useWishlist } from "@/lib/wishlist";

export function ProductCard({
    product,
    onAddToBasket,
    hideSellerName = false,
}: {
    product: Product & { storeName?: string; storeVerified?: boolean };
    onAddToBasket?: (product: Product) => void;
    hideSellerName?: boolean;
}) {
    const { items } = useCart();
    const wishlist = useWishlist();
    const isFavorite = wishlist.productIds.includes(product.id);
    const basketQuantity =
        items.find((item) => item.product.id === product.id)?.quantity ?? 0;

    function openProduct() {
        prefetchProduct(product.id);
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
                    onPress={openProduct}
                    style={styles.imagePressable}
                >
                    <MarketImage
                        uri={product.photos[0]}
                        style={styles.image}
                    />
                </Pressable>
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={
                        isFavorite
                            ? `Remove ${product.name} from wishlist`
                            : `Add ${product.name} to wishlist`
                    }
                    accessibilityState={{
                        selected: isFavorite,
                        disabled: !wishlist.ready || wishlist.saving,
                    }}
                    disabled={!wishlist.ready || wishlist.saving}
                    onPress={() => void wishlist.toggle(product.id)}
                    style={({ pressed }) => [
                        styles.favoriteButton,
                        pressed && styles.favoriteButtonPressed,
                        (!wishlist.ready || wishlist.saving) &&
                            styles.favoriteButtonDisabled,
                    ]}
                >
                    <Ionicons
                        name={isFavorite ? "heart" : "heart-outline"}
                        size={21}
                        color={isFavorite ? "#C83F4D" : palette.ink}
                        accessible={false}
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
                            {basketQuantity > 0 ? (
                                <Text style={styles.addBadgeText}>
                                    {basketQuantity}
                                </Text>
                            ) : (
                                <Ionicons
                                    name="add"
                                    size={11}
                                    color={palette.paper}
                                    accessible={false}
                                />
                            )}
                        </View>
                    </Pressable>
                )}
            </View>
            <View style={styles.details}>
                {!hideSellerName &&
                    (product.storeName ? (
                        <View style={styles.sellerRow}>
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
                                <Text
                                    style={styles.sellerName}
                                    numberOfLines={1}
                                >
                                    {product.storeName}
                                </Text>
                            </Pressable>
                            {product.storeVerified === true && (
                                <MaterialIcons
                                    name="verified"
                                    size={14}
                                    color={palette.brand}
                                    accessible
                                    accessibilityRole="image"
                                    accessibilityLabel="Verified seller"
                                />
                            )}
                        </View>
                    ) : (
                        <Text style={ui.small} numberOfLines={1}>
                            {product.category}
                        </Text>
                    ))}
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`${product.name}, ${money(product.priceCents)}`}
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
    favoriteButton: {
        position: "absolute",
        top: 8,
        right: 8,
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(255,255,255,0.94)",
        elevation: 2,
    },
    favoriteButtonPressed: { backgroundColor: palette.soft },
    favoriteButtonDisabled: { opacity: 0.6 },
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
        top: -3,
        right: -3,
        minWidth: 18,
        height: 18,
        borderRadius: 9,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: palette.brand,
        paddingHorizontal: 3,
    },
    addBadgeText: { color: palette.paper, fontSize: 10, fontWeight: "700" },
    details: { paddingTop: 10, gap: 4 },
    sellerRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        maxWidth: "100%",
    },
    sellerLink: { flexShrink: 1, minWidth: 0 },
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
