import { useEffect } from "react";
import { Image, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Feather from "@expo/vector-icons/Feather";
import Animated, {
    cancelAnimation,
    Easing,
    useAnimatedStyle,
    useReducedMotion,
    useSharedValue,
    withRepeat,
    withTiming,
} from "react-native-reanimated";
import { palette } from "@/constants/market-theme";
import { authLoading as styles } from "@/constants/auth-loading-styles";

function LoadingMark() {
    const reducedMotion = useReducedMotion();
    const rotation = useSharedValue(0);

    useEffect(() => {
        if (!reducedMotion) {
            rotation.value = withRepeat(
                withTiming(360, { duration: 2200, easing: Easing.linear }),
                -1,
                false,
            );
        }
        return () => cancelAnimation(rotation);
    }, [reducedMotion, rotation]);

    const ringStyle = useAnimatedStyle(() => ({
        transform: [{ rotate: `${rotation.value}deg` }],
    }));

    return (
        <View style={styles.halo} accessible={false}>
            <View style={styles.track}>
                <View style={styles.logoFrame}>
                    <Image
                        source={require("@/assets/images/shopyethu-icon.png")}
                        style={styles.logo}
                        accessible={false}
                    />
                </View>
            </View>
            <Animated.View style={[styles.ring, ringStyle]} />
        </View>
    );
}

export function SignInLoading() {
    return (
        <SafeAreaView style={styles.screen}>
            <ScrollView
                contentContainerStyle={styles.content}
                bounces={false}
                showsVerticalScrollIndicator={false}
            >
                <View
                    accessible
                    accessibilityRole="progressbar"
                    accessibilityLabel="Finishing sign-in. Getting your profile ready."
                    accessibilityState={{ busy: true }}
                    accessibilityLiveRegion="polite"
                    style={styles.main}
                >
                    <LoadingMark />
                    <View style={styles.copy}>
                        <Text style={styles.title}>Finishing sign-in</Text>
                        <Text style={styles.subtitle}>
                            We’re getting your profile ready.{"\n"}You’ll be
                            there in a moment.
                        </Text>
                    </View>
                </View>
                <View style={styles.footer}>
                    <Feather
                        name="lock"
                        size={12}
                        color={palette.brand}
                        accessible={false}
                    />
                    <Text style={styles.footerText}>Secure sign-in</Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
