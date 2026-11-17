import { Text, View } from "react-native";
import { ui } from "@/constants/market-theme";
import { styles } from "./cart-styles";
import { CartLoadingSkeleton } from "./CartLoadingSkeleton";

export function CartLoadingState({ error }: { error?: string }) {
    if (!error) return <CartLoadingSkeleton />;

    return (
        <View style={styles.loadingCard}>
            <Text
                accessibilityRole="alert"
                accessibilityLiveRegion="polite"
                style={[ui.error, { flex: 1 }]}
            >
                {error}
            </Text>
        </View>
    );
}
