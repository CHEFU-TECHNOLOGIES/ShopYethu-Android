import { Image, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Feather from "@expo/vector-icons/Feather";
import { Button } from "@/components/market/Primitives";
import { palette } from "@/constants/market-theme";
import { welcome } from "@/constants/welcome-styles";
import { useWelcomeScreen } from "@/hooks/use-welcome-screen";

export default function WelcomeScreen() {
    const { ready, session, authBusy, error, busy, enter, openAccount } =
        useWelcomeScreen();

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
                            Discover products from kasi sellers and small
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
