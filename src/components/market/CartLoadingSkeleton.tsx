import { StyleSheet, View } from "react-native";
import { palette } from "@/constants/market-theme";
import { styles as cart } from "./cart-styles";

export function CartLoadingSkeleton() {
    return (
        <View
            accessible
            accessibilityRole="progressbar"
            accessibilityLabel="Loading your basket"
            accessibilityState={{ busy: true }}
            accessibilityLiveRegion="polite"
            pointerEvents="none"
        >
            <View
                style={cart.loadingCard}
                accessible={false}
                importantForAccessibility="no-hide-descendants"
            >
                <View style={styles.image} />
                <View style={cart.loadingCopy}>
                    <View style={[styles.block, styles.title]} />
                    <View style={[styles.block, styles.subtitle]} />
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    image: {
        width: 76,
        height: 76,
        borderRadius: 12,
        backgroundColor: palette.soft,
    },
    block: { backgroundColor: palette.soft, borderRadius: 5 },
    title: { width: "72%", height: 14 },
    subtitle: { width: "90%", height: 12 },
});
