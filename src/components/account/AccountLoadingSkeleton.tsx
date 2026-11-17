import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
    cancelAnimation,
    useAnimatedStyle,
    useReducedMotion,
    useSharedValue,
    withRepeat,
    withTiming,
} from "react-native-reanimated";
import { palette } from "@/constants/market-theme";
import { profile } from "@/constants/account-profile-styles";

export function AccountLoadingSkeleton() {
    const reducedMotion = useReducedMotion();
    const opacity = useSharedValue(1);

    useEffect(() => {
        if (!reducedMotion) {
            opacity.value = withRepeat(
                withTiming(0.45, { duration: 900 }),
                -1,
                true,
            );
        }
        return () => cancelAnimation(opacity);
    }, [opacity, reducedMotion]);

    const pulse = useAnimatedStyle(() => ({ opacity: opacity.value }));

    return (
        <View
            accessible
            accessibilityRole="progressbar"
            accessibilityLabel="Loading your account"
            accessibilityState={{ busy: true }}
            accessibilityLiveRegion="polite"
            pointerEvents="none"
        >
            <Animated.View
                style={[profile.identityCard, pulse]}
                accessible={false}
                importantForAccessibility="no-hide-descendants"
            >
                <View style={styles.identity}>
                    <View style={profile.avatarFrame}>
                        <View style={profile.avatar} />
                    </View>
                    <View style={styles.copy}>
                        <View style={[styles.block, styles.name]} />
                        <View style={[styles.block, styles.email]} />
                    </View>
                </View>
                <View style={styles.manageAccount}>
                    <View style={[styles.block, styles.manageLabel]} />
                    <View style={[styles.block, styles.manageIcon]} />
                </View>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    identity: { flexDirection: "row", alignItems: "center", gap: 16 },
    copy: { flex: 1, minWidth: 0, gap: 8 },
    block: { backgroundColor: palette.soft, borderRadius: 6 },
    name: { width: "72%", height: 24 },
    email: { width: "88%", height: 16 },
    manageAccount: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "flex-end",
        gap: 6,
    },
    manageLabel: { width: 124, height: 16 },
    manageIcon: { width: 16, height: 16, borderRadius: 8 },
});
