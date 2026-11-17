import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { palette, ui } from "@/constants/market-theme";
import { Button } from "./Button";

export function EmptyBasket({ onBrowse }: { onBrowse: () => void }) {
    return (
        <View style={[ui.card, styles.card]}>
            <View style={styles.hero}>
                <View style={[styles.orbit, styles.orbitTop]} />
                <View style={[styles.orbit, styles.orbitBottom]} />
                <View style={[styles.productTile, styles.leftTile]}>
                    <Ionicons
                        name="shirt-outline"
                        size={22}
                        color="#9B6749"
                        accessible={false}
                    />
                </View>
                <View style={styles.basketTile}>
                    <Ionicons
                        name="basket-outline"
                        size={48}
                        color={palette.brand}
                        accessible={false}
                    />
                </View>
                <View style={[styles.productTile, styles.rightTile]}>
                    <Ionicons
                        name="pricetag-outline"
                        size={21}
                        color={palette.brand}
                        accessible={false}
                    />
                </View>
                <View style={styles.itemCount}>
                    <Text style={styles.itemCountText}>0 ITEMS</Text>
                </View>
            </View>

            <View style={styles.copy}>
                <Text style={[ui.heading, styles.title]}>
                    Your basket is empty
                </Text>
                <Text style={[ui.subtitle, styles.description]}>
                    Find something you love from a kasi seller. Add it to your
                    basket and it will be waiting here when you’re ready.
                </Text>
            </View>

            <View style={styles.steps}>
                <View style={styles.step}>
                    <View style={styles.stepIcon}>
                        <Ionicons
                            name="search-outline"
                            size={18}
                            color={palette.brand}
                            accessible={false}
                        />
                    </View>
                    <Text style={styles.stepText}>Browse</Text>
                </View>
                <View style={styles.stepConnector} />
                <View style={styles.step}>
                    <View style={styles.stepIcon}>
                        <Ionicons
                            name="basket-outline"
                            size={18}
                            color={palette.brand}
                            accessible={false}
                        />
                    </View>
                    <Text style={styles.stepText}>Add items</Text>
                </View>
                <View style={styles.stepConnector} />
                <View style={styles.step}>
                    <View style={styles.stepIcon}>
                        <Ionicons
                            name="receipt-outline"
                            size={18}
                            color={palette.brand}
                            accessible={false}
                        />
                    </View>
                    <Text style={styles.stepText}>Place order</Text>
                </View>
            </View>

            <Button
                title="Browse products"
                onPress={onBrowse}
               
            />
            <Text style={styles.footer}>
                Your basket is saved while you explore.
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        alignItems: "center",
        gap: 20,
        padding: 18,
        borderRadius: 24,
    },
    hero: {
        position: "relative",
        width: "100%",
        height: 184,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 20,
        backgroundColor: "#EEF2EA",
        overflow: "hidden",
    },
    orbit: {
        position: "absolute",
        borderWidth: 1,
        borderColor: "#DCE5D8",
        borderRadius: 100,
    },
    orbitTop: {
        width: 156,
        height: 156,
        top: -90,
        right: -44,
    },
    orbitBottom: {
        width: 130,
        height: 130,
        bottom: -88,
        left: -40,
    },
    basketTile: {
        width: 88,
        height: 88,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 26,
        backgroundColor: palette.paper,
        borderWidth: 1,
        borderColor: palette.line,
        elevation: 3,
        shadowColor: palette.ink,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    productTile: {
        position: "absolute",
        width: 42,
        height: 42,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 14,
        backgroundColor: palette.paper,
        borderWidth: 1,
        borderColor: palette.line,
    },
    leftTile: {
        top: 45,
        left: "18%",
        transform: [{ rotate: "-10deg" }],
    },
    rightTile: {
        right: "17%",
        bottom: 40,
        transform: [{ rotate: "10deg" }],
    },
    itemCount: {
        position: "absolute",
        top: 12,
        right: 12,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 16,
        backgroundColor: palette.paper,
    },
    itemCountText: {
        color: palette.brand,
        fontSize: 10,
        fontWeight: "700",
        letterSpacing: 0.8,
    },
    copy: {
        alignItems: "center",
        gap: 7,
    },
    eyebrow: {
        color: palette.brand,
        fontSize: 10,
        fontWeight: "700",
        letterSpacing: 1.4,
    },
    title: {
        textAlign: "center",
    },
    description: {
        textAlign: "center",
    },
    steps: {
        width: "100%",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    step: {
        flex: 1,
        alignItems: "center",
        gap: 6,
    },
    stepIcon: {
        width: 36,
        height: 36,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 18,
        backgroundColor: palette.soft,
    },
    stepText: {
        color: palette.muted,
        fontSize: 11,
        fontWeight: "600",
    },
    stepConnector: {
        width: 18,
        height: 1,
        marginBottom: 18,
        backgroundColor: palette.line,
    },
    footer: {
        marginTop: -8,
        color: palette.muted,
        fontSize: 11,
    },
});
