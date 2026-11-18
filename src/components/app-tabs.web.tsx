import { Tabs } from "expo-router";
import { palette } from "@/constants/market-theme";
import { useSellerAccount } from "@/hooks/use-seller-account";
export default function AppTabs() {
    const sellerAccount = useSellerAccount();
    const hasActiveStore = sellerAccount.data?.store?.status === "active";
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: palette.brand,
                tabBarStyle: { backgroundColor: palette.paper },
            }}
        >
            <Tabs.Screen name="index" options={{ title: "Shop" }} />
            <Tabs.Screen name="cart" options={{ title: "Basket" }} />
            <Tabs.Screen name="orders" options={{ title: "Orders" }} />
            <Tabs.Screen
                name="selling"
                options={{
                    title: "My Store",
                    href: hasActiveStore ? undefined : null,
                }}
            />
            <Tabs.Screen name="account" options={{ title: "Account" }} />
        </Tabs>
    );
}
