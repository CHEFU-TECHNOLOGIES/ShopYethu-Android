import { palette } from "@/constants/market-theme";
import { StyleSheet, View } from "react-native";

export function ProductEditorSkeleton() {
    return (
        <View
            accessibilityRole="progressbar"
            accessibilityLabel="Loading product editor"
            accessibilityState={{ busy: true }}
            accessibilityLiveRegion="polite"
            style={styles.content}
        >
            <View
                style={styles.skeleton}
                accessible={false}
                importantForAccessibility="no-hide-descendants"
            >
                <View style={styles.stepHeader}>
                    <View style={[styles.block, styles.stepTitle]} />
                    <View style={[styles.block, styles.stepCount]} />
                    <View style={styles.progress}>
                        {[0, 1, 2, 3].map((item) => (
                            <View
                                key={item}
                                style={[styles.block, styles.progressSegment]}
                            />
                        ))}
                    </View>
                </View>
                <View style={styles.fieldGroup}>
                    <View style={[styles.block, styles.label]} />
                    <View style={[styles.block, styles.input]} />
                    <View style={[styles.block, styles.label, styles.longLabel]} />
                    <View style={[styles.block, styles.multiline]} />
                    <View style={[styles.block, styles.label, styles.shortLabel]} />
                    <View style={[styles.block, styles.input]} />
                </View>
                <View style={[styles.block, styles.button]} />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    content: { width: "100%" },
    skeleton: { gap: 20 },
    block: { backgroundColor: palette.soft, borderRadius: 7 },
    stepHeader: { gap: 10 },
    stepTitle: { width: "62%", height: 22 },
    stepCount: { width: 90, height: 12 },
    progress: { flexDirection: "row", gap: 6 },
    progressSegment: { flex: 1, height: 5, borderRadius: 3 },
    fieldGroup: { gap: 11 },
    label: { width: 96, height: 12, marginBottom: -4 },
    longLabel: { width: 142 },
    shortLabel: { width: 70 },
    input: { height: 50, borderRadius: 12 },
    multiline: { height: 96, borderRadius: 12 },
    button: { height: 48, borderRadius: 12, backgroundColor: "#D6DFD2" },
});
