import { useRef, useState } from "react";
import { Image, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import Feather from "@expo/vector-icons/Feather";
import { Button } from "@/components/market/Primitives";
import { palette } from "@/constants/market-theme";
import { welcome } from "@/constants/welcome-styles";
import { useAuth } from "@/lib/auth";
import { useWelcome } from "@/lib/welcome";

export default function WelcomeScreen() {
    const { ready, session, signIn, busy: authBusy, error } = useAuth();
    const { complete } = useWelcome();
    const entering = useRef(false);
    const [busy, setBusy] = useState(false);

    async function enter(destination: "/" | "/account") {
        if (entering.current || authBusy) return;
        entering.current = true;
        setBusy(true);
        try {
            await complete();
            router.replace(destination);
        } finally {
            entering.current = false;
            setBusy(false);
        }
    }

    async function openAccount() {
        if (entering.current || authBusy) return;
        if (session) { await enter("/account"); return; }
        entering.current = true;
        setBusy(true);
        try {
            await complete();
            await signIn();
        } finally {
            entering.current = false;
            setBusy(false);
        }
    }

    return (
        <SafeAreaView style={welcome.page}>
            <ScrollView contentContainerStyle={welcome.content}>
                <View style={welcome.brand}>
                    <Text style={welcome.name}>ShopYethu</Text>
                    {/**TODO uncomment when we reach high downloads */}
                    {/* <Text style={welcome.byline}>by Chefu Technologies</Text> */}
                </View>
                <View style={welcome.introduction}>
                    <Image
                        source={require("@/assets/images/shopyethu-icon.png")}
                        style={welcome.icon}
                    />
                    <View style={welcome.copy}>
                        <Text accessibilityRole="header" style={welcome.title}>
                            {"Your local market.\nIn your pocket."}
                        </Text>
                        <Text style={welcome.description}>
                            Discover products from local sellers and small
                            businesses, or bring your own business online.
                        </Text>
                    </View>
                </View>
                <View style={welcome.actions}>
                    <Button
                        title="Start shopping"
                        disabled={!ready || busy || authBusy}
                        onPress={() => void enter("/")}
                        trailingIcon={
                            <Feather
                                name="arrow-right"
                                size={18}
                                color="#FFFFFF"
                                accessible={false}
                            />
                        }
                    />
                    <Button
                        title={session ? "Your account" : authBusy ? "Signing in…" : "Sign in"}
                        secondary
                        disabled={!ready || busy || authBusy}
                        onPress={() => void openAccount()}
                        trailingIcon={
                            <Feather
                                name="user"
                                size={18}
                                color={palette.brand}
                                accessible={false}
                            />
                        }
                    />
                    {error ? <Text accessibilityRole="alert" style={[welcome.note, { color: palette.danger }]}>{error}</Text> : null}
                    <Text style={welcome.note}>
                        Browse without an account. Sign in when you are ready to
                        order or start selling.
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
