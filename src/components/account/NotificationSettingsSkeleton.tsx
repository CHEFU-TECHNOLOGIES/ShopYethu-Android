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
import { notificationSettings } from "@/constants/notification-settings-styles";
import { palette } from "@/constants/market-theme";

const rows = [
    { titleWidth: "74%", descriptionWidth: "91%" },
    { titleWidth: "66%", descriptionWidth: "88%" },
    { titleWidth: "72%", descriptionWidth: "84%" },
];

export function NotificationSettingsSkeleton() {
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
            accessibilityLabel="Loading notification preferences"
            accessibilityState={{ busy: true }}
            accessibilityLiveRegion="polite"
            pointerEvents="none"
        >
            <Animated.View
                style={[notificationSettings.group, pulse]}
                accessible={false}
                importantForAccessibility="no-hide-descendants"
            >
                {rows.map((row, index) => (
                    <View key={index}>
                        <View style={notificationSettings.row}>
                            <View style={notificationSettings.copy}>
                                <View
                                    style={[
                                        styles.block,
                                        styles.title,
                                        { width: row.titleWidth },
                                    ]}
                                />
                                <View
                                    style={[
                                        styles.block,
                                        styles.description,
                                        { width: row.descriptionWidth },
                                    ]}
                                />
                            </View>
                            <View style={styles.switchTrack}>
                                <View style={styles.switchThumb} />
                            </View>
                        </View>
                        {index < rows.length - 1 && (
                            <View style={notificationSettings.separator} />
                        )}
                    </View>
                ))}
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    block: { backgroundColor: palette.soft, borderRadius: 6 },
    title: { height: 15 },
    description: { height: 11 },
    switchTrack: {
        width: 48,
        height: 28,
        borderRadius: 14,
        padding: 4,
        justifyContent: "center",
        backgroundColor: palette.soft,
    },
    switchThumb: {
        alignSelf: "flex-end",
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: palette.paper,
    },
});
