import { palette, ui } from "@/constants/market-theme";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

export function OrdersEmptyState({ onBrowse }: { onBrowse: () => void }) {
    return (
        <View style={[ui.card, styles.card]}>
            <View style={styles.hero}>
                <View style={styles.iconCircle}>
                    <Ionicons
                        name="receipt-outline"
                        size={36}
                        color={palette.brand}
                        accessible={false}
                    />
                </View>
                <View style={styles.statusBadge}>
                    <View style={styles.statusDot} />
                    <Text style={styles.statusText}>Ready when you are</Text>
                </View>
            </View>
            <View style={styles.copy}>
                <Text style={[ui.heading, styles.title]}>No orders yet</Text>
                <Text style={[ui.subtitle, styles.description]}>
                    Find something from a kasi seller. Your order details and
                    status updates will appear here after you place an order.
                </Text>
            </View>
            <View style={styles.note}>
                <Ionicons
                    name="information-circle-outline"
                    size={19}
                    color={palette.brand}
                    accessible={false}
                />
                <Text style={styles.noteText}>
                    Collection and payment details stay with each order.
                </Text>
            </View>
           
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        alignItems: "center",
        gap: 20,
        padding: 22,
        borderRadius: 24,
    },
    hero: {
        width: "100%",
        minHeight: 148,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 20,
        backgroundColor: palette.soft,
    },
    iconCircle: {
        width: 76,
        height: 76,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 24,
        backgroundColor: palette.paper,
        borderWidth: 1,
        borderColor: palette.line,
    },
    statusBadge: {
        position: "absolute",
        right: 12,
        bottom: 12,
        flexDirection: "row",
        alignItems: "center",
        gap: 7,
        paddingHorizontal: 10,
        paddingVertical: 7,
        borderRadius: 20,
        backgroundColor: palette.paper,
    },
    statusDot: {
        width: 7,
        height: 7,
        borderRadius: 4,
        backgroundColor: palette.accent,
    },
    statusText: {
        color: palette.ink,
        fontSize: 11,
        fontWeight: "600",
    },
    copy: {
        alignItems: "center",
        gap: 8,
    },
    title: {
        textAlign: "center",
    },
    description: {
        textAlign: "center",
    },
    note: {
        width: "100%",
        flexDirection: "row",
        alignItems: "center",
        gap: 9,
        padding: 12,
        borderRadius: 14,
        backgroundColor: "#F7F6F1",
    },
    noteText: {
        flex: 1,
        color: palette.muted,
        fontSize: 12,
        lineHeight: 18,
    },
});
