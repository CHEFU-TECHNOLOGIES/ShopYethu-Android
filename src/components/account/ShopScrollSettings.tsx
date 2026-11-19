import { useCallback } from "react";
import { useFocusEffect } from "expo-router";
import { Switch, Text, View } from "react-native";
import { AccountSection } from "@/components/account/AccountMenu";
import { account } from "@/constants/account-styles";
import { palette } from "@/constants/market-theme";
import { useShopScrollPreference } from "@/hooks/use-shop-scroll-preference";

export function ShopScrollSettings() {
    const {
        keepHeaderFixed,
        loading,
        saving,
        error,
        setKeepHeaderFixed,
        reload,
    } = useShopScrollPreference();

    useFocusEffect(useCallback(() => reload(), [reload]));

    return (
        <AccountSection title="Shop browsing">
            <View style={account.row}>
                <View style={account.rowText}>
                    <Text style={account.rowTitle}>Keep Shop header fixed</Text>
                    <Text style={account.rowDescription}>
                        {"On: Only products scroll.\nOff: The whole Shop screen scrolls."}
                    </Text>
                </View>
                <Switch
                    accessibilityLabel="Keep Shop header fixed"
                    accessibilityHint="When on, only the products list scrolls. When off, the entire Shop screen scrolls."
                    value={keepHeaderFixed}
                    onValueChange={(value) =>
                        void setKeepHeaderFixed(value)
                    }
                    disabled={loading || saving}
                    trackColor={{
                        false: palette.line,
                        true: palette.brand,
                    }}
                    thumbColor={palette.paper}
                />
            </View>
            {!!error && (
                <View style={account.error}>
                    <Text
                        accessibilityRole="alert"
                        accessibilityLiveRegion="polite"
                        style={account.errorText}
                    >
                        {error}
                    </Text>
                </View>
            )}
        </AccountSection>
    );
}
