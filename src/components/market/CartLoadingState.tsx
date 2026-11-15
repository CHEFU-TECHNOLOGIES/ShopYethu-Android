import { ActivityIndicator, Text, View } from "react-native";
import { palette, ui } from "@/constants/market-theme";
import { styles } from "./cart-styles";

export function CartLoadingState({ message }: { message?: string }) {
    return (
        <View style={styles.loadingCard}>
            <ActivityIndicator size="small" color={palette.brand} />
            <View style={styles.loadingCopy}>
                <Text style={styles.loadingTitle}>Loading your basket</Text>
                <Text style={ui.small}>
                    {message || "Syncing your saved items."}
                </Text>
            </View>
        </View>
    );
}
