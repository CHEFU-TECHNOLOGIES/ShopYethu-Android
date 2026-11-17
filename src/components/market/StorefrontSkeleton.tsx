import { palette } from "@/constants/market-theme";
import { StyleSheet, View } from "react-native";

export function StorefrontSkeleton() {
    return (
        <View
            accessibilityRole="progressbar"
            accessibilityLabel="Loading storefront and products"
            accessibilityState={{ busy: true }}
            accessibilityLiveRegion="polite"
        >
            <View
                style={styles.content}
                accessible={false}
                importantForAccessibility="no-hide-descendants"
            >
                <View style={styles.hero}>
                    <View style={[styles.block, styles.storeName]} />
                    <View style={styles.location}>
                        <View style={[styles.block, styles.locationLabel]} />
                        <View style={[styles.block, styles.locationName]} />
                    </View>
                    <View style={styles.description}>
                        <View style={[styles.block, styles.descriptionLine]} />
                        <View
                            style={[
                                styles.block,
                                styles.descriptionLine,
                                styles.shortLine,
                            ]}
                        />
                    </View>
                </View>

                <View style={styles.productsHeading}>
                    <View style={styles.headingLines}>
                        <View style={[styles.block, styles.heading]} />
                        <View style={[styles.block, styles.subheading]} />
                    </View>
                    <View style={[styles.block, styles.count]} />
                </View>

                <View style={styles.grid}>
                    {[0, 1, 2, 3].map((item) => (
                        <View key={item} style={styles.product}>
                            <View style={[styles.block, styles.photo]} />
                            <View style={[styles.block, styles.productName]} />
                            <View style={[styles.block, styles.price]} />
                        </View>
                    ))}
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    content: { gap: 18 },
    block: { backgroundColor: palette.soft, borderRadius: 6 },
    hero: {
        gap: 14,
        padding: 18,
        borderRadius: 22,
        backgroundColor: palette.brand,
    },
    storeName: { width: "72%", height: 28 },
    location: { gap: 7 },
    locationLabel: { width: 90, height: 9, backgroundColor: "#557563" },
    locationName: { width: "43%", height: 14, backgroundColor: "#557563" },
    description: { gap: 7 },
    descriptionLine: { width: "94%", height: 12, backgroundColor: "#557563" },
    shortLine: { width: "68%" },
    productsHeading: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 10,
    },
    headingLines: { flex: 1, gap: 7 },
    heading: { width: 130, height: 20 },
    subheading: { width: 165, height: 12 },
    count: { width: 82, height: 26, borderRadius: 13 },
    grid: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
    },
    product: { width: "48%", gap: 9, marginBottom: 16 },
    photo: { width: "100%", aspectRatio: 0.9, borderRadius: 16 },
    productName: { width: "85%", height: 13 },
    price: { width: "45%", height: 14 },
});
