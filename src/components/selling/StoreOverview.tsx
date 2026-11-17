import { OperatingAreaLabel } from "@/components/market/OperatingAreaLabel";
import { ui } from "@/constants/market-theme";
import { sellerStyles as styles } from "@/constants/seller-styles";
import type { SellerInventory } from "@/types/marketplace";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { StoreActionsMenu } from "./StoreActionsMenu";
import { StoreStats } from "./StoreStats";

export function StoreOverview({ data }: { data: SellerInventory }) {
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <View style={[styles.store, menuOpen && overviewStyles.menuOpen]}>
            <View style={ui.between}>
                <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
                    <Text
                        style={styles.storeName}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                    >
                        {data.store.name}
                    </Text>
                    <OperatingAreaLabel
                        area={data.store.area}
                        placeId={data.store.areaPlaceId}
                        style={styles.storeArea}
                        numberOfLines={1}
                    />
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
