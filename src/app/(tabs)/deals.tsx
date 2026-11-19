import { Ionicons } from "@expo/vector-icons";
import { Page } from "@/components/market/Primitives";
import { palette, ui } from "@/constants/market-theme";
import { StyleSheet, Text, View } from "react-native";

export default function DealsScreen() {
    return (
        <Page title="Deals">
            <View style={styles.emptyState}>
                <View style={styles.iconCircle}>
                    <Ionicons
                        name="pricetag-outline"
                        size={34}
                        color={palette.brand}
                        accessible={false}
                    />
                </View>
                <Text style={ui.heading}>Deals are coming soon</Text>
                <Text style={[ui.subtitle, styles.description]}>
                    We’re working on bringing special offers from local sellers.
                    Check back soon.
                </Text>
            </View>
        </Page>
    );
}

const styles = StyleSheet.create({
    emptyState: {
        alignItems: "center",
        gap: 14,
        paddingHorizontal: 24,
        paddingVertical: 56,
    },
    iconCircle: {
        width: 82,
        height: 82,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 28,
        backgroundColor: palette.soft,
        marginBottom: 4,
    },
    description: { textAlign: "center" },
});
