import { sellerStyles as styles } from "@/constants/seller-styles";
import type { Product } from "@/types/marketplace";
import { Text, View } from "react-native";

export function StoreStats({ products }: { products: Product[] }) {
    const stats: [string, number][] = [
        ["Published", products.filter((product) => product.published).length],
        ["Drafts", products.filter((product) => !product.published).length],
        [
            "Out of stock",
            products.filter(
                (product) => product.published && product.stock === 0,
            ).length,
        ],
    ];

    return (
        <View style={styles.stats}>
            {stats.map(([label, count], index) => (
                <View
                    key={label}
                    style={[
                        styles.stat,
                        index < stats.length - 1 && styles.statDivider,
                    ]}
                    accessible
                    accessibilityLabel={`${label}: ${count}`}
                >
                    <Text
                        style={styles.statNumber}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.75}
                    >
                        {count > 99 ? "99+" : count}
                    </Text>
                    <Text style={styles.statLabel}>{label}</Text>
                </View>
            ))}
        </View>
    );
}
