import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { sellerStyles as styles } from "@/constants/seller-styles";
import { ui } from "@/constants/market-theme";
import type { SellerInventory } from "@/hooks/use-seller-inventory";

export function StoreOverview({ data }: { data: SellerInventory }) {
    const stats = [
        [
            "Published",
            data.products.filter((product) => product.published).length,
        ],
        [
            "Drafts",
            data.products.filter((product) => !product.published).length,
        ],
        [
            "Out of stock",
            data.products.filter(
                (product) => product.published && product.stock === 0,
            ).length,
        ],
    ];
    return (
        <View style={styles.store}>
            <View style={ui.between}>
                <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
                    <Text style={styles.storeName} numberOfLines={1} ellipsizeMode="tail">{data.store.name}</Text>
                    <Text style={styles.storeArea} numberOfLines={1} ellipsizeMode="tail">{data.store.area}</Text>
                </View>
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Edit storefront"
                    onPress={() => router.push("/selling/store")}
                    style={styles.storeAction}
                    hitSlop={6}
                >
                    <Ionicons name="create-outline" size={20} color="#FFFFFF" />
                </Pressable>
            </View>
            <View style={styles.stats}>
                {stats.map(([label, count]) => (
                    <View key={label} style={styles.stat} accessible accessibilityLabel={`${label}: ${count}`}>
                        <Text style={styles.statNumber} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>{count}</Text>
                        <Text style={styles.statLabel}>{label}</Text>
                    </View>
                ))}
            </View>
        </View>
    );
}
