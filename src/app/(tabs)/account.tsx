import { Text, View } from "react-native";
import { router } from "expo-router";
import Feather from "@expo/vector-icons/Feather";
import { Button, Page, ResourceState } from "@/components/market/Primitives";
import { useAuth } from "@/lib/auth";
import { useResource } from "@/hooks/use-resource";
import type { SellerApplication, Storefront } from "@/types/marketplace";
import { statusLabel, ui } from "@/constants/market-theme";

export default function AccountScreen() {
    const { session, ready, busy, error, signIn, signOut } = useAuth();
    const resource = useResource<{
        application: SellerApplication | null;
        store: Storefront | null;
    }>("/me", !!session);
    const application = resource.data?.application,
        store = resource.data?.store;
    return (
        <Page
            title={
                session
                    ? `Hello, ${session.user.name.split(" ")[0]}.`
                    : "A little more local."
            }
            subtitle="One account for shopping and selling."
        >
            {!ready && <Text style={ui.subtitle}>Restoring your sign-in…</Text>}
            {error && (
                <Text accessibilityRole="alert" style={ui.error}>
                    {error}
                </Text>
            )}
            {!session ? (
                <View style={ui.card}>
                    <Text style={ui.heading}>
                        Welcome to your neighbourhood
                    </Text>
                    <Text style={ui.subtitle}>
                        Sign in to save your orders and grow your own local
                        business.
                    </Text>
                    <Button
                        title={busy ? "Signing in…" : "Continue"}
                        trailingIcon={!busy && (
                            <Feather
                                name="external-link"
                                size={18}
                                color="#FFFFFF"
                                accessible={false}
                            />
                        )}
                        disabled={!ready || busy}
                        onPress={() => void signIn()}
                    />
                </View>
            ) : (
                <>
                    <View style={ui.card}>
                        <Text style={ui.heading}>{session.user.name}</Text>
                        <Text style={ui.subtitle}>{session.user.email}</Text>
                        <Button
                            title="Refresh account & application"
                            secondary
                            onPress={resource.refresh}
                        />
                    </View>
                    <ResourceState {...resource} retry={resource.refresh} />
                    {application && (
                        <View style={ui.card}>
                            <Text style={ui.badge}>SELLER APPLICATION</Text>
                            <Text style={ui.heading}>
                                {statusLabel(application.status)}
                            </Text>
                            <Text style={ui.body}>
                                {application.businessName}
                            </Text>
                            {!!application.reason && (
                                <Text style={ui.subtitle}>
                                    {application.reason}
                                </Text>
                            )}
                            <Text style={ui.small}>
                                You can keep shopping while CheFu reviews your
                                application.
                            </Text>
                            {application.status === "more-info" && (
                                <Button
                                    title="Respond & resubmit"
                                    onPress={() => router.push("/application")}
                                />
                            )}
                        </View>
                    )}
                    {store && (
                        <View style={ui.card}>
                            <Text style={ui.badge}>YOUR BUSINESS</Text>
                            <Text style={ui.heading}>{store.name}</Text>
                            <Text style={ui.badge}>
                                {statusLabel(store.status)}
                            </Text>
                            {!!store.reason && (
                                <Text style={ui.subtitle}>{store.reason}</Text>
                            )}
                            <Button
                                title="My Store"
                                onPress={() => router.push("/selling")}
                            />
                            <Text style={ui.small}>
                                Selling permissions are checked by the backend
                                on every store action.
                            </Text>
                        </View>
                    )}
                    {!application && resource.data && (
                        <View style={ui.card}>
                            <Text style={ui.heading}>
                                Your next chapter starts here.
                            </Text>
                            <Text style={ui.subtitle}>
                                Bring your local business online. Apply once;
                                keep shopping while we review it.
                            </Text>
                            <Button
                                title="Start selling"
                                onPress={() => router.push("/application")}
                            />
                        </View>
                    )}
                    <Button
                        title="Keep shopping"
                        secondary
                        onPress={() => router.push("/")}
                    />
                    <Button
                        title="Switch account"
                        secondary
                        disabled={busy}
                        onPress={() => void signIn()}
                    />
                    <Button
                        title="Sign out on this device"
                        secondary
                        onPress={() => void signOut()}
                    />
                </>
            )}
        </Page>
    );
}
