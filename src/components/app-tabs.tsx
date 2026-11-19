import { NativeTabs } from "expo-router/native-tabs";
import { Ionicons } from "@expo/vector-icons";
import { palette } from "@/constants/market-theme";
import { useSellerAccount } from "@/hooks/use-seller-account";

export default function AppTabs() {
    const sellerAccount = useSellerAccount();
    const hasActiveStore = sellerAccount.data?.store?.status === "active";
    
    return (
        <NativeTabs
            backgroundColor={palette.paper}
            indicatorColor={palette.soft}
            tintColor={palette.brand}
            labelStyle={{
                color: palette.muted,
                selected: { color: palette.brand },
            }}
        >
            <NativeTabs.Trigger name="index">
                <NativeTabs.Trigger.Label>Shop</NativeTabs.Trigger.Label>
                <NativeTabs.Trigger.Icon md="storefront" sf="storefront" />
            </NativeTabs.Trigger>
            <NativeTabs.Trigger name="orders">
                <NativeTabs.Trigger.Label>Orders</NativeTabs.Trigger.Label>
                <NativeTabs.Trigger.Icon md="receipt_long" sf="shippingbox" />
            </NativeTabs.Trigger>
            <NativeTabs.Trigger name="selling" hidden={!hasActiveStore}>
                <NativeTabs.Trigger.Label>My Store</NativeTabs.Trigger.Label>
                <NativeTabs.Trigger.Icon
                    src={
                        <NativeTabs.Trigger.VectorIcon
                            family={Ionicons}
                            name="storefront-outline"
                        />
                    }
                    selectedColor="black"
                />
            </NativeTabs.Trigger>
            <NativeTabs.Trigger name="deals">
                <NativeTabs.Trigger.Label>Deals</NativeTabs.Trigger.Label>
                <NativeTabs.Trigger.Icon
                    src={
                        <NativeTabs.Trigger.VectorIcon
                            family={Ionicons}
                            name="pricetag-outline"
                        />
                    }
                    selectedColor={palette.brand}
                />
            </NativeTabs.Trigger>

            <NativeTabs.Trigger name="account">
                <NativeTabs.Trigger.Label>Settings</NativeTabs.Trigger.Label>
                <NativeTabs.Trigger.Icon md="settings" sf="gearshape" />
            </NativeTabs.Trigger>
        </NativeTabs>
    );
}
