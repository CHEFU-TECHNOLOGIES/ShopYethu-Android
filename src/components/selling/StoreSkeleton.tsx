import { useCallback } from "react";
import { StyleSheet, View } from "react-native";
import { useFocusEffect } from "expo-router";
import Animated, {
    cancelAnimation,
    useAnimatedStyle,
    useReducedMotion,
    useSharedValue,
    withRepeat,
    withTiming,
} from "react-native-reanimated";
import { palette } from "@/constants/market-theme";

export function StoreSkeleton() {
    const reducedMotion = useReducedMotion();
    const opacity = useSharedValue(1);

    useFocusEffect(useCallback(() => {
        opacity.set(reducedMotion
            ? 1
            : withRepeat(withTiming(0.55, { duration: 1000 }), -1, true));
        return () => cancelAnimation(opacity);
    }, [opacity, reducedMotion]));

    const pulse = useAnimatedStyle(() => ({ opacity: opacity.get() }));

    return (
        <View
            accessible
            accessibilityRole="progressbar"
            accessibilityLabel="Loading your store and products"
            accessibilityState={{ busy: true }}
            accessibilityLiveRegion="polite"
            pointerEvents="none"
        >
            <Animated.View
                style={[styles.content, pulse]}
                accessible={false}
                importantForAccessibility="no-hide-descendants"
            >
                <View style={styles.store}>
                    <View style={styles.row}>
                        <View style={styles.copy}>
                            <View style={[styles.block, styles.storeName]} />
                            <View style={[styles.block, styles.area]} />
                        </View>
                        <View style={[styles.block, styles.edit]} />
                    </View>
                    <View style={styles.stats}>
                        {[0, 1, 2].map(index => (
                            <View key={index} style={styles.stat}>
                                <View style={[styles.block, styles.number]} />
                                <View style={[styles.block, styles.statLabel]} />
                            </View>
                        ))}
                    </View>
                </View>

                <View style={styles.row}>
                    <View style={[styles.block, styles.action]} />
                    <View style={[styles.block, styles.action]} />
                </View>

                <View style={styles.inventory}>
                    <View style={styles.row}>
                        <View style={[styles.block, styles.heading]} />
                        <View style={[styles.block, styles.count]} />
                    </View>
                    <View style={[styles.block, styles.searchLabel]} />
                    <View style={[styles.block, styles.search]} />
                    <View style={styles.filters}>
                        {[0, 1, 2].map(index => (
                            <View key={index} style={[styles.block, styles.filter]} />
                        ))}
                    </View>
                    {[0, 1, 2].map(index => (
                        <View key={index} style={styles.product}>
                            <View style={[styles.block, styles.thumbnail]} />
                            <View style={styles.copy}>
                                <View style={[styles.block, styles.badge]} />
                                <View style={[styles.block, styles.productName]} />
                                <View style={[styles.block, styles.price]} />
                                <View style={[styles.block, styles.stock]} />
                            </View>
                        </View>
                    ))}
                </View>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    content: { gap: 18 },
    block: { backgroundColor: palette.soft, borderRadius: 6 },
    row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
    copy: { flex: 1, gap: 10 },
    store: { padding: 16, borderRadius: 20, gap: 14, backgroundColor: palette.paper, borderWidth: 1, borderColor: palette.line },
    storeName: { width: "65%", height: 24 },
    area: { width: "40%", height: 12 },
    edit: { width: 44, height: 44, borderRadius: 22 },
    stats: { flexDirection: "row", gap: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: palette.line },
    stat: { flex: 1, gap: 7 },
    number: { width: 28, height: 22 },
    statLabel: { width: "75%", height: 10 },
    action: { flex: 1, height: 48, borderRadius: 12 },
    inventory: { gap: 12 },
    heading: { width: 92, height: 22 },
    count: { width: 76, height: 24, borderRadius: 12 },
    searchLabel: { width: 100, height: 12, marginTop: 4 },
    search: { height: 48, borderRadius: 12, opacity: 0.7 },
    filters: { flexDirection: "row", gap: 6, marginBottom: 2 },
    filter: { flex: 1, height: 40, borderRadius: 12 },
    product: { flexDirection: "row", alignItems: "center", gap: 14, padding: 14, borderRadius: 18, backgroundColor: palette.paper, borderWidth: 1, borderColor: palette.line },
    thumbnail: { width: 80, height: 80, borderRadius: 13 },
    badge: { width: 62, height: 10 },
    productName: { width: "85%", height: 16 },
    price: { width: 68, height: 14 },
    stock: { width: 88, height: 10 },
});
