import { NativeTabs } from "expo-router/native-tabs";
import { palette } from "@/constants/market-theme";
import { useCart } from "@/lib/cart";
import { useSellerAccount } from "@/hooks/use-seller-account";

export default function AppTabs() {
    const { items } = useCart();
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
            <NativeTabs.Trigger name="cart">
                <NativeTabs.Trigger.Label>Basket</NativeTabs.Trigger.Label>
                <NativeTabs.Trigger.Icon md="shopping_bag" sf="bag" />
                <NativeTabs.Trigger.Badge hidden={!items.length}>
                    {String(
                        items.reduce((sum, item) => sum + item.quantity, 0),
                    )}
                </NativeTabs.Trigger.Badge>
            </NativeTabs.Trigger>
            <NativeTabs.Trigger name="selling" hidden={!hasActiveStore}>
                <NativeTabs.Trigger.Label>My Store</NativeTabs.Trigger.Label>
                <NativeTabs.Trigger.Icon md="inventory_2" sf="archivebox" />
            </NativeTabs.Trigger>
            <NativeTabs.Trigger name="orders">
                <NativeTabs.Trigger.Label>Orders</NativeTabs.Trigger.Label>
                <NativeTabs.Trigger.Icon md="receipt_long" sf="shippingbox" />
            </NativeTabs.Trigger>

            <NativeTabs.Trigger name="account">
                <NativeTabs.Trigger.Label>Settings</NativeTabs.Trigger.Label>
                <NativeTabs.Trigger.Icon md="settings" sf="gearshape" />
            </NativeTabs.Trigger>
        </NativeTabs>
    );
}
