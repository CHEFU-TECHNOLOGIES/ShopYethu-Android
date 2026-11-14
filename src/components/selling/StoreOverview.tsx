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
                <View style={{ flex: 1, gap: 5 }}>
                    <Text style={styles.storeStatus}>
                        YOUR STOREFRONT · ACTIVE
                    </Text>
                    <Text style={styles.storeName}>{data.store.name}</Text>
                    <Text style={styles.storeArea}>{data.store.area}</Text>
                </View>
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Edit storefront"
                    onPress={() => router.push("/selling/store")}
                    style={styles.storeAction}
                >
                    <Ionicons name="create-outline" size={23} color="#FFFFFF" />
                </Pressable>
            </View>
            <View style={styles.stats}>
                {stats.map(([label, count]) => (
                    <View key={label} style={styles.stat}>
                        <Text style={styles.statNumber}>{count}</Text>
                        <Text style={styles.statLabel}>{label}</Text>
                    </View>
                ))}
            </View>
        </View>
    );
}
