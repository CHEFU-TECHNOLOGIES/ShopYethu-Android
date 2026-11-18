import { OperatingAreaLabel } from "@/components/market/OperatingAreaLabel";
import { CatalogSortSelector } from "@/components/market/CatalogSortSelector";
import { FontAwesome, MaterialIcons } from "@expo/vector-icons";
import { palette, ui } from "@/constants/market-theme";
import { toast } from "@/lib/toast";
import type { CatalogSort, Storefront } from "@/types/marketplace";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";

export function StorefrontHeader({
    store,
    sort,
    onSortChange,
}: {
    store: Storefront;
    sort: CatalogSort;
    onSortChange: (value: CatalogSort) => void;
}) {
    async function openWhatsApp() {
        const number = store.phone?.replace(/\D/g, "");
        if (!number) {
            toast.error("This seller's WhatsApp number is unavailable.");
            return;
        }
        try {
            await Linking.openURL(`https://wa.me/${number}`);
        } catch {
            toast.error("Could not open WhatsApp. Please try again.");
        }
    }

    async function openPhone() {
        const number = store.phone?.trim().replace(/[^\d+]/g, "");
        if (!number) {
            toast.error("This seller's phone number is unavailable.");
            return;
        }
        try {
            await Linking.openURL(`tel:${number}`);
        } catch {
            toast.error("Could not open the phone app. Please try again.");
        }
    }

    return (
        <>
            <View style={styles.hero}>
                <View style={styles.storeTitleRow}>
                    <Text
                        accessibilityRole="header"
                        numberOfLines={1}
                        ellipsizeMode="tail"
                        style={styles.storeName}
                    >
                        {store.name}
                    </Text>
                    {store.verified === true && (
                        <MaterialIcons
                            name="verified"
                            size={18}
                            color="#A9D7B3"
                            accessible
                            accessibilityRole="image"
                            accessibilityLabel="Verified seller"
                        />
                    )}
                </View>
                <View style={styles.location}>
                    <Text style={styles.locationLabel}>OPERATING AREA</Text>
                    <OperatingAreaLabel
                        area={store.area}
                        placeId={store.areaPlaceId}
                        style={styles.locationName}
                    />
                </View>
                {!!store.phone && (
                    <View style={styles.contactCard}>
                        
                        <View style={styles.contactDetails}>
                            <Text style={styles.contactLabel}>PHONE</Text>
                            <Text
                                numberOfLines={1}
                                ellipsizeMode="tail"
                                style={styles.contactNumber}
                            >
                                {store.phone}
                            </Text>
                        </View>
                        {store.whatsappAvailable === true ? (
                            <Pressable
                                style={styles.whatsappBadge}
                                accessibilityRole="button"
                                accessibilityLabel="Message seller on WhatsApp"
                                accessibilityHint="Opens a WhatsApp chat with this seller"
                                onPress={() => void openWhatsApp()}
                            >
                                <FontAwesome
                                    name="whatsapp"
                                    size={16}
                                    color="#25D366"
                                />
                                <Text style={styles.whatsappLabel}>
                                    WhatsApp
                                </Text>
                            </Pressable>
                        ) : (
                            <Pressable
                                style={styles.phoneBadge}
                                accessibilityRole="button"
                                accessibilityLabel="Call seller by phone"
                                accessibilityHint="Opens the phone app with this seller's number ready"
                                onPress={() => void openPhone()}
                            >
                                <FontAwesome
                                    name="phone"
                                    size={15}
                                    color={palette.paper}
                                />
                                <Text style={styles.phoneLabel}>Phone</Text>
                            </Pressable>
                        )}
                    </View>
                )}
                {!!store.description && (
                    <Text style={styles.description}>{store.description}</Text>
                )}
            </View>
            <View style={styles.productsHeading}>
                <View style={styles.productsTitle}>
                    <Text style={ui.heading}>Shop products</Text>
                    <Text style={ui.small}>Available from this seller</Text>
                </View>
                <CatalogSortSelector value={sort} onChange={onSortChange} />
            </View>
        </>
    );
}

const styles = StyleSheet.create({
    hero: {
        gap: 14,
        padding: 18,
        borderRadius: 22,
        backgroundColor: palette.brand,
    },
    storeTitleRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    location: { gap: 3 },
    contactCard: {
        flexDirection: "row",
        alignItems: "center",
        gap: 11,
        padding: 11,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.14)",
        backgroundColor: "rgba(255,255,255,0.09)",
    },
    phoneIcon: {
        width: 36,
        height: 36,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 12,
        backgroundColor: "rgba(255,255,255,0.14)",
    },
    contactDetails: { flex: 1, minWidth: 0, gap: 2 },
    contactLabel: {
        color: "#C7D6CB",
        fontSize: 9,
        fontWeight: "700",
        letterSpacing: 0.9,
    },
    contactNumber: {
        color: palette.paper,
        fontSize: 14,
        fontWeight: "600",
        flexShrink: 1,
    },
    whatsappBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingHorizontal: 10,
        paddingVertical: 7,
        borderRadius: 999,
        backgroundColor: "rgba(37,211,102,0.14)",
    },
    phoneBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingHorizontal: 10,
        paddingVertical: 7,
        borderRadius: 999,
        backgroundColor: "rgba(255,255,255,0.14)",
    },
    whatsappLabel: {
        color: "#B9F2CB",
        fontSize: 11,
        fontWeight: "700",
    },
    phoneLabel: {
        color: palette.paper,
        fontSize: 11,
        fontWeight: "700",
    },
    locationLabel: {
        color: "#C7D6CB",
        fontSize: 9,
        fontWeight: "700",
        letterSpacing: 1,
    },
    locationName: { color: palette.paper, fontSize: 14, fontWeight: "600" },
    storeName: {
        color: palette.paper,
        fontFamily: "serif",
        fontSize: 23,
        fontWeight: "700",
        lineHeight: 29,
        flexShrink: 1,
    },
    description: { color: "#E4ECE6", fontSize: 13, lineHeight: 19 },
    productsHeading: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingTop: 2,
        gap: 10,
    },
    productsTitle: { flex: 1, gap: 2 },
});
