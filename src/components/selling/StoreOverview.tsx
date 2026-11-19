import { OperatingAreaLabel } from "@/components/market/OperatingAreaLabel";
import { sellerStyles as styles } from "@/constants/seller-styles";
import type { SellerInventory } from "@/types/marketplace";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { StoreActionsMenu } from "./StoreActionsMenu";
import { StoreStats } from "./StoreStats";

export function StoreOverview({ data }: { data: SellerInventory }) {
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <View style={[styles.store, menuOpen && overviewStyles.menuOpen]}>
            <View style={styles.storeHeader}>
                <View style={styles.storeIcon}>
                    <Ionicons
                        name="storefront"
                        size={25}
                        color="#06432F"
                        accessible={false}
                    />
                </View>
                <View style={styles.storeIdentity}>
                    <View style={styles.storeNameRow}>
                        <Text
                            style={styles.storeName}
                            numberOfLines={1}
                            ellipsizeMode="tail"
                        >
                            {data.store.name}
                        </Text>
                        {data.store.verified ? (
                            <MaterialIcons
                                name="verified"
                                size={16}
                                color="#85E76F"
                                accessibilityRole="image"
                                accessibilityLabel="Verified store"
                            />
                        ) : null}
                    </View>
                    <View style={styles.storeLocation}>
                        <Ionicons
                            name="location-outline"
                            size={13}
                            color="#DDE7DF"
                            accessible={false}
                        />
                        <OperatingAreaLabel
                            area={data.store.area}
                            placeId={data.store.areaPlaceId}
                            style={styles.storeArea}
                            numberOfLines={1}
                        />
                    </View>
                </View>
                <StoreActionsMenu
                    store={data.store}
                    open={menuOpen}
                    onOpenChange={setMenuOpen}
                />
            </View>
            <StoreStats products={data.products} />
        </View>
    );
}

const overviewStyles = StyleSheet.create({
    menuOpen: {
        zIndex: 2,
        elevation: 2,
    },
});
