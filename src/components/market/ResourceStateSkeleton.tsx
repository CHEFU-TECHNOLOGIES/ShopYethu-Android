import { StyleSheet, View } from "react-native";
import { palette, ui } from "@/constants/market-theme";

export function ResourceStateSkeleton() {
    return (
        <View
            accessible
            accessibilityRole="progressbar"
            accessibilityLabel="Loading content"
            accessibilityState={{ busy: true }}
            accessibilityLiveRegion="polite"
            pointerEvents="none"
        >
            <View
                style={[ui.card, styles.card]}
                accessible={false}
                importantForAccessibility="no-hide-descendants"
            >
                <View style={styles.icon} />
                <View style={styles.copy}>
                    <View style={[styles.block, styles.title]} />
                    <View style={[styles.block, styles.description]} />
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
        paddingVertical: 16,
    },
    icon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: palette.soft,
    },
    copy: { flex: 1, gap: 8 },
    block: { backgroundColor: palette.soft, borderRadius: 5 },
    title: { width: "54%", height: 15 },
    description: { width: "82%", height: 12 },
});
