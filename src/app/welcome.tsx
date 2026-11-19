import { Image, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Feather from "@expo/vector-icons/Feather";
import { Button } from "@/components/market/Primitives";
import { DebouncedPressable } from "@/components/ui/DebouncedPressable";
import { palette } from "@/constants/market-theme";
import { welcome } from "@/constants/welcome-styles";
import { useWelcomeScreen } from "@/hooks/use-welcome-screen";

export default function WelcomeScreen() {
    const {
        ready,
        session,
        authBusy,
        error,
        busy,
        openAccount,
        openSignUp,
    } = useWelcomeScreen();

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
                        title="Get started"
                        disabled={!ready || busy || authBusy}
                        onPress={() => void openSignUp()}
                        trailingIcon={
                            <Feather
                                name="arrow-right"
                                size={18}
                                color="#FFFFFF"
                                accessible={false}
                            />
                        }
                    />

                    {!session ? (
                        <DebouncedPressable
                            accessibilityRole="button"
                            accessibilityLabel="Already have an account? Sign in"
                            disabled={!ready || busy || authBusy}
                            onPress={() => void openAccount()}
                            style={welcome.signupPrompt}
                        >
                            <Text style={welcome.signupText}>
                                Already have an account?{" "}
                                <Text style={welcome.signupLink}>Sign in</Text>
                            </Text>
                        </DebouncedPressable>
                    ) : null}
                    {error ? (
                        <Text
                            accessibilityRole="alert"
                            style={[welcome.note, { color: palette.danger }]}
                        >
                            {error}
                        </Text>
                    ) : null}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
