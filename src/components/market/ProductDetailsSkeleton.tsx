import { palette, ui } from "@/constants/market-theme";
import { StyleSheet, View } from "react-native";

export function ProductDetailsSkeleton() {
    return (
        <View
            accessibilityRole="progressbar"
            accessibilityLabel="Loading product details"
            accessibilityState={{ busy: true }}
            accessibilityLiveRegion="polite"
        >
            <View
                style={styles.content}
                accessible={false}
                importantForAccessibility="no-hide-descendants"
            >
                <View style={[styles.block, styles.gallery]} />
                <View style={[ui.card, styles.details]}>
                    <View style={styles.meta}>
                        <View style={[styles.block, styles.category]} />
                        <View style={[styles.block, styles.stock]} />
                    </View>
                    <View style={[styles.block, styles.name]} />
                    <View style={[styles.block, styles.price]} />
                </View>
                <View style={[ui.card, styles.section]}>
                    <View style={[styles.block, styles.sectionTitle]} />
                    <View style={[styles.block, styles.description]} />
                    <View style={[styles.block, styles.description, styles.short]} />
                </View>
                <View style={[styles.block, styles.store]} />
                <View style={[styles.block, styles.purchase]} />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    content: { width: "100%", maxWidth: 640, alignSelf: "center", gap: 14 },
    block: { backgroundColor: palette.soft, borderRadius: 8 },
    gallery: { width: "100%", aspectRatio: 1.04, borderRadius: 22 },
    details: { gap: 12 },
    meta: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    category: { width: 94, height: 28, borderRadius: 14 },
    stock: { width: 96, height: 28, borderRadius: 14 },
    name: { width: "78%", height: 28 },
    price: { width: 108, height: 22 },
    section: { gap: 10 },
    sectionTitle: { width: 138, height: 17 },
    description: { width: "96%", height: 13 },
    short: { width: "66%" },
    store: { height: 76, borderRadius: 18 },
    purchase: { height: 82, borderRadius: 18 },
});
