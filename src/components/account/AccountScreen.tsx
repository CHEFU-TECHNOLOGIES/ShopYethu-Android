import {
    ActivityIndicator,
    Text,
    View,
} from "react-native";
import { DebouncedPressable as Pressable } from "@/components/ui/DebouncedPressable";
import { SafeAreaView } from "react-native-safe-area-context";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import Feather from "@expo/vector-icons/Feather";
import { AccountRow, AccountSection } from "./AccountMenu";
import { AccountIdentity, AccountSignIn } from "./AccountProfile";
import { AccountLoadingSkeleton } from "./AccountLoadingSkeleton";
import { SignOutConfirmation } from "./SignOutConfirmation";
import { SellerAccountSection } from "./SellerAccountSection";
import { account } from "@/constants/account-styles";
import { palette, ui } from "@/constants/market-theme";
import { useAccountScreen } from "@/hooks/use-account-screen";

export default function AccountScreen() {
    const {
        session,
        ready,
        busy,
        error,
        resource,
        signingOut,
        confirmingSignOut,
        setConfirmingSignOut,
        actionError,
        refreshCooldownSeconds,
        authBusy,
        version,
        versionCode,
        handleSignIn,
        refreshAccount,
        openNotificationSettings,
        handleSignOut,
    } = useAccountScreen();

    return (
        <SafeAreaView style={ui.page} edges={["top"]}>
            <View style={account.settings}>
                <View style={account.settingsFixed}>
                    <View style={account.header}>
                        <Text
                            accessibilityRole="header"
                            style={account.heading}
                        >
                            Settings
                        </Text>
                        {ready && session && (
                            <Pressable
                                accessibilityRole="button"
                                accessibilityLabel={
                                    resource.refreshing
                                        ? "Refreshing account and seller status"
                                        : refreshCooldownSeconds > 0
                                          ? `Refresh account and seller status available in ${refreshCooldownSeconds} seconds`
                                        : "Refresh account and seller status"
                                }
                                accessibilityState={{
                                    disabled:
                                        resource.loading ||
                                        resource.refreshing,
                                    busy: resource.refreshing,
                                }}
                                disabled={
                                    resource.loading ||
                                    resource.refreshing
                                }
                                onPress={refreshAccount}
                                style={({ pressed }) => [
                                    account.refresh,
                                    (pressed || refreshCooldownSeconds > 0) &&
                                        account.pressed,
                                ]}
                            >
                                {resource.refreshing ? (
                                    <ActivityIndicator
                                        size="small"
                                        color={palette.brand}
                                    />
                                ) : (
                                    <Feather
                                        name="refresh-cw"
                                        size={19}
                                        color={palette.brand}
                                        accessible={false}
                                    />
                                )}
                            </Pressable>
                        )}
                    </View>
                    {!ready ? (
                        <AccountLoadingSkeleton />
                    ) : session ? (
                        <>
                            <AccountIdentity user={session.user} />
                            <View
                                accessibilityElementsHidden
                                style={account.profileDivider}
                            />
                        </>
                    ) : (
                        <AccountSignIn
                            busy={authBusy}
                            onSignIn={handleSignIn}
                        />
                    )}
                </View>
                <KeyboardAwareScrollView
                    style={account.settingsScroll}
                    contentContainerStyle={account.settingsScrollContent}
                    showsVerticalScrollIndicator={false}
                    bottomOffset={24}
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode="on-drag"
                >
                    {!!(actionError || error) && (
                        <View style={account.error}>
                            <Feather
                                name="alert-circle"
                                size={17}
                                color={palette.danger}
                                accessible={false}
                            />
                            <Text
                                accessibilityRole="alert"
                                accessibilityLiveRegion="polite"
                                style={account.errorText}
                            >
                                {actionError || error}
                            </Text>
                        </View>
                    )}
                    <AccountSection title="Notifications">
                        <AccountRow
                            title="Notification settings"
                            description="Choose the types of ShopYethu notifications you want."
                            onPress={() =>
                                void openNotificationSettings()
                            }
                        />
                    </AccountSection>
                    <AccountSection title="Legal">
                        <AccountRow
                            title="Privacy Policy"
                            description="How ShopYethu handles your information."
                            descriptionLines={1}
                            href="https://www.chefu.co.za/privacy/shopyethu"
                            trailingIcon="external-link"
                            divider
                        />
                        <AccountRow
                            title="Terms of Service"
                            description="Terms for using ShopYethu."
                            descriptionLines={1}
                            href="https://www.chefu.co.za/terms/shopyethu"
                            trailingIcon="external-link"
                        />
                    </AccountSection>
                    {ready && (
                        <>
                            {session && (
                                <>
                                    <SellerAccountSection
                                        {...resource}
                                        onRetry={refreshAccount}
                                    />
                                    <AccountSection title="Account options">
                                        <AccountRow
                                            title={
                                                busy
                                                    ? "Switching account…"
                                                    : "Switch account"
                                            }
                                            onPress={handleSignIn}
                                            disabled={authBusy}
                                            trailingIcon="external-link"
                                            divider
                                        />
                                        <AccountRow
                                            title={
                                                signingOut
                                                    ? "Signing out…"
                                                    : "Sign out"
                                            }
                                            onPress={() =>
                                                setConfirmingSignOut(true)
                                            }
                                            disabled={authBusy}
                                            danger
                                            trailingIcon={null}
                                        />
                                    </AccountSection>
                                </>
                            )}
                        </>
                    )}
                    <Text style={account.footer}>
                        Version {version} - ({versionCode})
                    </Text>
                </KeyboardAwareScrollView>
            </View>
            <SignOutConfirmation
                visible={confirmingSignOut}
                onCancel={() => setConfirmingSignOut(false)}
                onConfirm={() => {
                    setConfirmingSignOut(false);
                    void handleSignOut();
                }}
            />
        </SafeAreaView>
    );
}
