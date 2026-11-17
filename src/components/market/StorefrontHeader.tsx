import { OperatingAreaLabel } from "@/components/market/OperatingAreaLabel";
import { MaterialIcons } from "@expo/vector-icons";
import { palette, ui } from "@/constants/market-theme";
import type { Storefront } from "@/types/marketplace";
import { StyleSheet, Text, View } from "react-native";

export function StorefrontHeader({
    store,
    productCount,
    hasMore,
}: {
    store: Storefront;
    productCount: number;
    hasMore: boolean;
}) {
    return (
        <>
            <View style={styles.hero}>
                <View style={styles.storeTitleRow}>
                    <Text
                        accessibilityRole="header"
                        numberOfLines={1}
                        ellipsizeMode="tail"
                        style={styles.storeName}
                    >
                        {store.name}
                    </Text>
                    {store.verified === true && (
                        <MaterialIcons
                            name="verified"
                            size={18}
                            color="#A9D7B3"
                            accessible
                            accessibilityRole="image"
                            accessibilityLabel="Verified seller"
                        />
                    )}
                </View>
                <View style={styles.location}>
                    <Text style={styles.locationLabel}>OPERATING AREA</Text>
                    <OperatingAreaLabel
                        area={store.area}
                        placeId={store.areaPlaceId}
                        style={styles.locationName}
                    />
                </View>
                {!!store.description && (
                    <Text style={styles.description}>{store.description}</Text>
                )}
            </View>
            <View style={styles.productsHeading}>
                <View style={styles.productsTitle}>
                    <Text style={ui.heading}>Shop products</Text>
                    <Text style={ui.small}>Available from this seller</Text>
                </View>
                <View style={styles.productCount}>
                    <Text style={styles.productCountText}>
                        {productCount}
                        {hasMore ? "+" : ""}{" "}
                        {productCount === 1 ? "product" : "products"}
                    </Text>
                </View>
            </View>
        </>
    );
}

const styles = StyleSheet.create({
    hero: {
        gap: 14,
        padding: 18,
        borderRadius: 22,
        backgroundColor: palette.brand,
    },
    storeTitleRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    location: { gap: 3 },
    locationLabel: {
        color: "#C7D6CB",
        fontSize: 9,
        fontWeight: "700",
        letterSpacing: 1,
    },
    locationName: { color: palette.paper, fontSize: 14, fontWeight: "600" },
    storeName: {
        color: palette.paper,
        fontFamily: "serif",
        fontSize: 23,
        fontWeight: "700",
        lineHeight: 29,
        flexShrink: 1,
    },
    description: { color: "#E4ECE6", fontSize: 13, lineHeight: 19 },
    productsHeading: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingTop: 2,
        gap: 10,
    },
    productsTitle: { flex: 1, gap: 2 },
    productCount: {
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 16,
        backgroundColor: palette.soft,
    },
    productCountText: {
        color: palette.brand,
        fontSize: 11,
        fontWeight: "700",
    },
});
