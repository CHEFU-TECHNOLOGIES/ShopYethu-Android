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
                <NativeTabs.Trigger.Icon
                    src={{
                        default: (
                            <NativeTabs.Trigger.VectorIcon
                                family={Ionicons}
                                name="bag-handle-outline"
                            />
                        ),
                        selected: (
                            <NativeTabs.Trigger.VectorIcon
                                family={Ionicons}
                                name="bag-handle"
                            />
                        ),
                    }}
                    selectedColor={palette.brand}
                />
            </NativeTabs.Trigger>
            <NativeTabs.Trigger name="orders">
                <NativeTabs.Trigger.Label>Orders</NativeTabs.Trigger.Label>
                <NativeTabs.Trigger.Icon
                    src={{
                        default: (
                            <NativeTabs.Trigger.VectorIcon
                                family={Ionicons}
                                name="receipt-outline"
                            />
                        ),
                        selected: (
                            <NativeTabs.Trigger.VectorIcon
                                family={Ionicons}
                                name="receipt"
                            />
                        ),
                    }}
                    selectedColor={palette.brand}
                />
            </NativeTabs.Trigger>
            <NativeTabs.Trigger name="selling" hidden={!hasActiveStore}>
                <NativeTabs.Trigger.Label>My Store</NativeTabs.Trigger.Label>
                <NativeTabs.Trigger.Icon
                    src={{
                        default: (
                            <NativeTabs.Trigger.VectorIcon
                                family={Ionicons}
                                name="storefront-outline"
                            />
                        ),
                        selected: (
                            <NativeTabs.Trigger.VectorIcon
                                family={Ionicons}
                                name="storefront"
                            />
                        ),
                    }}
                    selectedColor={palette.brand}
                />
            </NativeTabs.Trigger>
            <NativeTabs.Trigger name="deals">
                <NativeTabs.Trigger.Label>Deals</NativeTabs.Trigger.Label>
                <NativeTabs.Trigger.Icon
                    src={{
                        default: (
                            <NativeTabs.Trigger.VectorIcon
                                family={Ionicons}
                                name="pricetag-outline"
                            />
                        ),
                        selected: (
                            <NativeTabs.Trigger.VectorIcon
                                family={Ionicons}
                                name="pricetag"
                            />
                        ),
                    }}
                    selectedColor={palette.brand}
                />
            </NativeTabs.Trigger>

            <NativeTabs.Trigger name="account">
                <NativeTabs.Trigger.Label>Settings</NativeTabs.Trigger.Label>
                <NativeTabs.Trigger.Icon
                    src={{
                        default: (
                            <NativeTabs.Trigger.VectorIcon
                                family={Ionicons}
                                name="settings-outline"
                            />
                        ),
                        selected: (
                            <NativeTabs.Trigger.VectorIcon
                                family={Ionicons}
                                name="settings"
                            />
                        ),
                    }}
                    selectedColor={palette.brand}
                />
            </NativeTabs.Trigger>
        </NativeTabs>
    );
}
