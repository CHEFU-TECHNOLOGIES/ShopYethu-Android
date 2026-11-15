import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { palette, ui } from "@/constants/market-theme";
import { Button } from "./Button";

export function EmptyBasket({ onBrowse }: { onBrowse: () => void }) {
    return (
        <View style={[ui.card, styles.card]}>
            <View style={styles.iconCircle}>
                <Ionicons
                    name="basket-outline"
                    size={34}
                    color={palette.brand}
                    accessible={false}
                />
            </View>
            <View style={styles.copy}>
                <Text style={[ui.heading, styles.center]}>
                    Your basket is empty
                </Text>
                <Text style={[ui.subtitle, styles.center]}>
                    Browse local products and add something you love.
                </Text>
            </View>
            <View style={styles.button}>
                <Button
                    title="Start shopping"
                    onPress={onBrowse}
                    trailingIcon={
                        <Ionicons
                            name="arrow-forward"
                            size={18}
                            color="#FFFFFF"
                            accessible={false}
                        />
                    }
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        alignItems: "center",
        paddingHorizontal: 22,
        paddingVertical: 28,
    },
    iconCircle: {
        width: 72,
        height: 72,
        borderRadius: 36,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: palette.soft,
    },
    copy: {
        alignItems: "center",
        gap: 6,
    },
    center: {
        textAlign: "center",
    },
    button: {
        width: "100%",
    },
});
