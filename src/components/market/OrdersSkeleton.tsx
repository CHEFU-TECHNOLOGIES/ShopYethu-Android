import { StyleSheet, View } from "react-native";
import { palette, ui } from "@/constants/market-theme";

export function OrdersSkeleton() {
    return (
        <View
            accessibilityRole="progressbar"
            accessibilityLabel="Loading orders"
            accessibilityState={{ busy: true }}
            accessibilityLiveRegion="polite"
        >
            <View
                style={styles.list}
                accessible={false}
                importantForAccessibility="no-hide-descendants"
            >
                {[0, 1, 2].map((item) => (
                    <View key={item} style={[ui.card, styles.card]}>
                        <View style={styles.row}>
                            <View style={[styles.block, styles.reference]} />
                            <View style={[styles.block, styles.status]} />
                        </View>
                        <View style={[styles.block, styles.items]} />
                        <View style={styles.row}>
                            <View style={[styles.block, styles.date]} />
                            <View style={[styles.block, styles.total]} />
                        </View>
                    </View>
                ))}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    list: { gap: 14 },
    card: { padding: 14, gap: 12, borderRadius: 16 },
    row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
    block: { height: 13, borderRadius: 6, backgroundColor: palette.soft },
    reference: { width: "38%", height: 16 },
    status: { width: 82, height: 26, borderRadius: 13 },
    items: { width: "72%" },
    date: { width: "28%" },
    total: { width: 70, height: 16 },
});
