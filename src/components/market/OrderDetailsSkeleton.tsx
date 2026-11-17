import { palette, ui } from "@/constants/market-theme";
import { StyleSheet, View } from "react-native";

export function OrderDetailsSkeleton({ selling = false }: { selling?: boolean }) {
    return (
        <View
            accessibilityRole="progressbar"
            accessibilityLabel="Loading order details"
            accessibilityState={{ busy: true }}
            accessibilityLiveRegion="polite"
        >
            <View
                style={[ui.card, styles.card]}
                accessible={false}
                importantForAccessibility="no-hide-descendants"
            >
                <View style={styles.row}>
                    <View style={[styles.block, styles.reference]} />
                    <View style={[styles.block, styles.status]} />
                </View>
                <View style={[styles.block, styles.note]} />
                <View style={[styles.block, styles.date]} />
                {[0, 1].map((item) => (
                    <View key={item} style={styles.row}>
                        <View style={[styles.block, styles.itemName]} />
                        <View style={[styles.block, styles.itemPrice]} />
                    </View>
                ))}
                <View style={[styles.block, styles.total]} />
                <View style={[styles.block, styles.fulfilment]} />
                <View style={styles.row}>
                    <View style={[styles.block, styles.paymentLabel]} />
                    <View style={[styles.block, styles.paymentValue]} />
                </View>
                <View style={[styles.block, styles.note]} />
                {selling && <View style={[styles.block, styles.contact]} />}
                <View style={styles.divider} />
                <View style={styles.row}>
                    <View style={[styles.block, styles.updates]} />
                    <View style={[styles.block, styles.hide]} />
                </View>
                {!selling && <View style={[styles.block, styles.report]} />}
                {selling && <View style={[styles.block, styles.action]} />}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    card: { gap: 13 },
    row: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
    },
    block: { height: 13, borderRadius: 6, backgroundColor: palette.soft },
    reference: { width: "42%", height: 18 },
    status: { width: 90, height: 28, borderRadius: 14 },
    note: { width: "88%" },
    date: { width: "54%", height: 11 },
    itemName: { width: "52%", height: 15 },
    itemPrice: { width: 64, height: 15 },
    total: { width: 96, height: 19, alignSelf: "flex-end" },
    fulfilment: { width: "78%", height: 14 },
    paymentLabel: { width: 68, height: 11 },
    paymentValue: { width: 120, height: 11 },
    contact: { width: "72%", height: 15 },
    divider: { height: 1, backgroundColor: palette.line, marginVertical: 3 },
    updates: { width: 148, height: 15 },
    hide: { width: 40, height: 12 },
    report: { width: 142, height: 16, marginTop: 4 },
    action: {
        width: "100%",
        height: 46,
        marginTop: 4,
        borderRadius: 12,
        backgroundColor: "#D6DFD2",
    },
});
