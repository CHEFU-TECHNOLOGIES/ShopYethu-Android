import { useState } from "react";
import { Image, Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import type { Product } from "@/types/marketplace";
import { money, palette, ui } from "@/constants/market-theme";
import { sellerStyles as styles } from "@/constants/seller-styles";

export function ProductThumbnail({ url }: { url?: string }) {
    const [failed, setFailed] = useState(false);
    return url && !failed ? (
        <Image
            accessibilityLabel="Product photo"
            source={{ uri: url }}
            style={styles.image}
            resizeMode="cover"
            onError={() => setFailed(true)}
        />
    ) : (
        <Ionicons name="image-outline" size={28} color={palette.muted} />
    );
}
export function InventoryRow({ product }: { product: Product }) {
    return (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Edit ${product.name}, ${product.published ? "published" : "draft"}, ${product.stock} in stock`}
            style={styles.productRow}
            onPress={() =>
                router.push({
                    pathname: "/selling/product",
                    params: { id: product.id },
                })
            }
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
                        !product.published && styles.mutedStatus,
                    ]}
                >
                    {product.published ? "PUBLISHED" : "DRAFT"}
                </Text>
                <Text style={styles.productName} numberOfLines={2}>
                    {product.name}
                </Text>
                <Text style={styles.price}>{money(product.priceCents)}</Text>
                <Text style={product.stock === 0 ? ui.error : ui.small}>
                    {product.stock === 0
                        ? "Out of stock"
                        : `${product.stock} in stock`}
                </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={palette.muted} />
        </Pressable>
    );
}
