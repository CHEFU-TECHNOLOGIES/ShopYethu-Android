import { palette } from "@/constants/market-theme";
import { StyleSheet, View } from "react-native";

export function ApplicationSkeleton() {
    return (
        <View
            accessibilityRole="progressbar"
            accessibilityLabel="Loading seller application"
            accessibilityState={{ busy: true }}
            accessibilityLiveRegion="polite"
        >
            <View
                style={styles.content}
                accessible={false}
                importantForAccessibility="no-hide-descendants"
            >
                <View style={styles.stepHeader}>
                    <View style={[styles.block, styles.title]} />
                    <View style={[styles.block, styles.subtitle]} />
                    <View style={styles.progress}>
                        {[0, 1, 2, 3].map((item) => (
                            <View
                                key={item}
                                style={[styles.block, styles.segment]}
                            />
                        ))}
                    </View>
                </View>
                <View style={styles.fields}>
                    {[0, 1, 2].map((item) => (
                        <View key={item} style={styles.field}>
                            <View style={[styles.block, styles.label]} />
                            <View style={[styles.block, styles.input]} />
                        </View>
                    ))}
                </View>
                <View style={[styles.block, styles.button]} />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    content: { gap: 20 },
    block: { backgroundColor: palette.soft, borderRadius: 7 },
    stepHeader: { gap: 10 },
    title: { width: "64%", height: 23 },
    subtitle: { width: 94, height: 12 },
    progress: { flexDirection: "row", gap: 6 },
    segment: { flex: 1, height: 5, borderRadius: 3 },
    fields: { gap: 14 },
    field: { gap: 8 },
    label: { width: "32%", height: 12 },
    input: { width: "100%", height: 50, borderRadius: 12 },
    button: {
        width: "100%",
        height: 48,
        borderRadius: 12,
        backgroundColor: "#D6DFD2",
    },
});
