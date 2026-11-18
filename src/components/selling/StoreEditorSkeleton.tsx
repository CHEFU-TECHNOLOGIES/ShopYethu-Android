import { palette } from "@/constants/market-theme";
import { StyleSheet, View } from "react-native";

export function StoreEditorSkeleton() {
    return (
        <View
            accessibilityRole="progressbar"
            accessibilityLabel="Loading storefront details"
            accessibilityState={{ busy: true }}
            accessibilityLiveRegion="polite"
            style={styles.content}
        >
            <View
                style={styles.fields}
                accessible={false}
                importantForAccessibility="no-hide-descendants"
            >
                <View style={[styles.block, styles.label, styles.nameLabel]} />
                <View style={[styles.block, styles.input]} />
                <View style={[styles.block, styles.label, styles.aboutLabel]} />
                <View style={[styles.block, styles.multiline]} />
                <View style={[styles.block, styles.label, styles.phoneLabel]} />
                <View style={[styles.block, styles.input]} />
                <View style={[styles.block, styles.label, styles.areaLabel]} />
                <View style={[styles.block, styles.input]} />
                <View style={[styles.block, styles.button]} />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    content: { width: "100%" },
    fields: { gap: 12 },
    block: { backgroundColor: palette.soft, borderRadius: 8 },
    label: { height: 12, marginBottom: -5 },
    nameLabel: { width: 82 },
    phoneLabel: { width: 160 },
    aboutLabel: { width: 112 },
    areaLabel: { width: 104 },
    input: { height: 50, borderRadius: 12 },
    multiline: { height: 104, borderRadius: 12 },
    button: {
        height: 48,
        marginTop: 4,
        borderRadius: 12,
        backgroundColor: "#D6DFD2",
    },
});
