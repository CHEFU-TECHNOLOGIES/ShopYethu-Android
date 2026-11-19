import { useState } from "react";
import { Text, Vibration, View } from "react-native";
import { DebouncedPressable as Pressable } from "@/components/ui/DebouncedPressable";
import { MarketImage } from "@/components/market/MarketImage";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import type { Product } from "@/types/marketplace";
import { money, palette, ui } from "@/constants/market-theme";
import { sellerStyles as styles } from "@/constants/seller-styles";

export function ProductThumbnail({ url }: { url?: string }) {
    const [failed, setFailed] = useState(false);
    return url && !failed ? (
        <MarketImage
            accessibilityLabel="Product photo"
            uri={url}
            width={240}
            style={styles.image}
            onError={() => setFailed(true)}
        />
    ) : (
        <Ionicons name="image-outline" size={28} color={palette.muted} />
    );
}
export function InventoryRow({
    product,
    onActions,
}: {
    product: Product;
    onActions: (product: Product) => void;
}) {
    function openActionsWithHaptic() {
        Vibration.vibrate(70);
        onActions(product);
    }

    return (
        <View style={styles.productCard}>
            <Pressable
                accessibilityRole="button"
                accessibilityLabel={
                    product.published
                        ? `View ${product.name}, published, ${product.stock} in stock`
                        : `Manage ${product.name}, draft, ${product.stock} in stock`
                }
                accessibilityHint={
                    product.published
                        ? "Tap to view product details. Touch and hold to manage this product."
                        : "Tap to manage this draft."
                }
                style={[styles.productRow, styles.productMain]}
                onLongPress={openActionsWithHaptic}
                onPress={() => {
                    if (!product.published) {
                        onActions(product);
                        return;
                    }
                    router.navigate({
                        pathname: "/product/[id]",
                        params: { id: product.id },
                    });
                }}
            >
                <View style={styles.thumbnail}>
                    <ProductThumbnail
                        key={product.photos[0]}
                        url={product.photos[0]}
                    />
                </View>
                <View style={styles.rowContent}>
                    <Text
                        style={[
                            styles.status,
                            product.published
                                ? styles.publishedStatus
                                : styles.draftStatus,
                        ]}
                    >
                        {product.published ? "PUBLISHED" : "DRAFT"}
                    </Text>
                    <Text style={styles.productName} numberOfLines={1}>
                        {product.name}
                    </Text>
                    <Text style={styles.price}>
                        {money(product.priceCents)}
                    </Text>
                    <Text style={product.stock === 0 ? ui.error : ui.small}>
                        {product.stock === 0
                            ? "Out of stock"
                            : `${product.stock} in stock`}
                    </Text>
                </View>
            </Pressable>
            <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Manage ${product.name}`}
                accessibilityHint="Edit, move to draft or delete this product"
                onLongPress={openActionsWithHaptic}
                onPress={() => onActions(product)}
                style={styles.productMenu}
            >
                <Ionicons
                    name="ellipsis-vertical"
                    size={21}
                    color={palette.muted}
                />
            </Pressable>
        </View>
    );
}
