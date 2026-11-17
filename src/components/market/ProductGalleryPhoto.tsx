import { Ionicons } from "@expo/vector-icons";
import { palette } from "@/constants/market-theme";
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
    cancelAnimation,
    useAnimatedStyle,
    useReducedMotion,
    useSharedValue,
    withRepeat,
    withTiming,
} from "react-native-reanimated";
import { MarketImage } from "./MarketImage";

export function ProductGalleryPhoto({
    uri,
    label,
    width,
    height,
}: {
    uri: string;
    label: string;
    width: number;
    height: number;
}) {
    const [loading, setLoading] = useState(true);
    const [failed, setFailed] = useState(false);
    const reducedMotion = useReducedMotion();
    const opacity = useSharedValue(1);

    useEffect(() => {
        if (loading && !reducedMotion) {
            opacity.set(withRepeat(withTiming(0.55, { duration: 900 }), -1, true));
        } else {
            cancelAnimation(opacity);
            opacity.set(loading ? 1 : 0);
        }
        return () => cancelAnimation(opacity);
    }, [loading, opacity, reducedMotion]);

    const pulse = useAnimatedStyle(() => ({ opacity: opacity.get() }));

    return (
        <View style={[styles.frame, { width, height }]}>
            <MarketImage
                accessibilityLabel={label}
                uri={uri}
                width={960}
                style={StyleSheet.absoluteFill}
                onLoad={() => setLoading(false)}
                onLoadStart={() => {
                    setLoading(true);
                    setFailed(false);
                }}
                onError={() => {
                    setLoading(false);
                    setFailed(true);
                }}
            />
            {loading && (
                <Animated.View
                    accessibilityElementsHidden
                    importantForAccessibility="no-hide-descendants"
                    pointerEvents="none"
                    style={[StyleSheet.absoluteFill, styles.skeleton, pulse]}
                >
                    <View style={styles.skeletonHighlight} />
                </Animated.View>
            )}
            {failed && (
                <View
                    accessibilityElementsHidden
                    importantForAccessibility="no-hide-descendants"
                    pointerEvents="none"
                    style={styles.failed}
                >
                    <Ionicons
                        name="image-outline"
                        size={38}
                        color={palette.muted}
                    />
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    frame: {
        overflow: "hidden",
        backgroundColor: palette.soft,
    },
    skeleton: {
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: palette.soft,
    },
    skeletonHighlight: {
        width: "72%",
        height: "64%",
        borderRadius: 18,
        backgroundColor: "#F1F4EE",
    },
    failed: {
        ...StyleSheet.absoluteFill,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: palette.soft,
    },
});
