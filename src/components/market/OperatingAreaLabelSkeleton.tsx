import { StyleSheet, View } from "react-native";
import type { StyleProp, TextStyle } from "react-native";
import { palette } from "@/constants/market-theme";

export function OperatingAreaLabelSkeleton({
    prefix,
    style,
}: {
    prefix: string;
    style?: StyleProp<TextStyle>;
}) {
    const fontSize = StyleSheet.flatten(style)?.fontSize ?? 14;
    const lineHeight = StyleSheet.flatten(style)?.lineHeight ?? fontSize * 1.4;

    return (
        <View
            accessible
            accessibilityRole="progressbar"
            accessibilityLabel="Loading operating area"
            accessibilityState={{ busy: true }}
            accessibilityLiveRegion="polite"
            style={{ height: lineHeight, justifyContent: "center" }}
            pointerEvents="none"
        >
            <View
                style={[
                    styles.block,
                    {
                        width: prefix ? 150 : 96,
                        height: Math.max(8, fontSize * 0.7),
                    },
                ]}
                accessible={false}
                importantForAccessibility="no-hide-descendants"
            />
        </View>
    );
}

const styles = StyleSheet.create({
    block: { borderRadius: 4, backgroundColor: palette.soft },
});
