import { useRef, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { DebouncedPressable as Pressable } from "@/components/ui/DebouncedPressable";
import { router } from "expo-router";
import Feather from "@expo/vector-icons/Feather";
import { Page } from "@/components/market/Primitives";
import { AccountRow, AccountSection } from "./AccountMenu";
import { AccountIdentity, AccountSignIn } from "./AccountProfile";
import { SignOutConfirmation } from "./SignOutConfirmation";
import { SellerAccountSection } from "./SellerAccountSection";
import { account } from "@/constants/account-styles";
import { palette } from "@/constants/market-theme";
import { useAuth } from "@/lib/auth";
import { useSellerAccount } from "@/hooks/use-seller-account";
import Constants from "expo-constants";

export default function AccountScreen() {
    const { session, ready, busy, error, signIn, signOut } = useAuth();
    const resource = useSellerAccount();
    const signOutLock = useRef(false);
    const [signingOut, setSigningOut] = useState(false);
    const [confirmingSignOut, setConfirmingSignOut] = useState(false);
    const [actionError, setActionError] = useState("");
    const authBusy = busy || signingOut;
    const version = Constants.expoConfig?.version ?? "";
    const versionCode = Constants.expoConfig?.android?.versionCode ?? "";

    function handleSignIn() {
        setActionError("");
        void signIn();
    }

    async function handleSignOut() {
        if (signOutLock.current || busy) return;
        signOutLock.current = true;
        setSigningOut(true);
        setActionError("");
        try {
            await signOut();
        } catch {
            setActionError("Could not sign out. Please try again.");
        } finally {
            signOutLock.current = false;
            setSigningOut(false);
        }
    }

    return (
        <View style={{ flex: 1 }}>
            <Page
                title="Account"
                header={
                    <View style={account.header}>
                        <Text
                            accessibilityRole="header"
                            style={account.heading}
                        >
                            Account
                        </Text>
                        {ready && session && (
                            <Pressable
                                accessibilityRole="button"
                                accessibilityLabel={
                                    resource.refreshing
                                        ? "Refreshing account and seller status"
                                        : "Refresh account and seller status"
                                }
                                accessibilityState={{
                                    disabled:
                                        resource.loading || resource.refreshing,
                                    busy: resource.refreshing,
                                }}
                                disabled={
                                    resource.loading || resource.refreshing
                                }
                                onPress={resource.refresh}
                                style={({ pressed }) => [
                                    account.refresh,
                                    pressed && account.pressed,
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
                }
            >
                {!ready ? (
                    <View
                        accessibilityLiveRegion="polite"
                        style={account.loading}
                    >
                        <ActivityIndicator size="small" color={palette.brand} />
                        <Text style={account.message}>
                            Loading your account…
                        </Text>
                    </View>
                ) : (
                    <>
                        {session ? (
                            <AccountIdentity user={session.user} />
                        ) : (
                            <AccountSignIn
                                busy={authBusy}
                                onSignIn={handleSignIn}
                            />
                        )}
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
                        <AccountSection
                            title={session ? "Shopping" : "Explore"}
                        >
                            {session && (
                                <AccountRow
                                    icon="package"
                                    title="My orders"
                                    onPress={() => router.navigate("/orders")}
                                    divider
                                />
                            )}
                            <AccountRow
                                icon="shopping-bag"
                                title="Browse products"
                                onPress={() => router.navigate("/")}
                            />
                        </AccountSection>
                        {session && (
                            <>
                                <SellerAccountSection
                                    {...resource}
                                    onRetry={resource.refresh}
                                />
                                <AccountSection title="Account options">
                                    <AccountRow
                                        icon="repeat"
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
                                        icon="log-out"
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
                <Text
                    style={{
                        color: "#888",
                        fontSize: 12,
                    }}
                >
                    Version {version} - ({versionCode})
                </Text>
            </Page>
            <SignOutConfirmation
                visible={confirmingSignOut}
                onCancel={() => setConfirmingSignOut(false)}
                onConfirm={() => {
                    setConfirmingSignOut(false);
                    void handleSignOut();
                }}
            />
        </View>
    );
}
