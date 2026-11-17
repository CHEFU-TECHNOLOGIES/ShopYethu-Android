import { Text, View } from "react-native";
import { router } from "expo-router";
import { ui } from "@/constants/market-theme";
import { Button } from "./Button";

export function SignInNotice({
    title = "Make yourself at home",
    subtitle = "Sign in to start a basket, track orders, or start selling.",
}: {
    title?: string;
    subtitle?: string;
}) {
    return (
        <View style={ui.card}>
            <Text style={ui.heading}>{title}</Text>
            <Text style={ui.subtitle}>{subtitle}</Text>
            <Button
                title="Go to account"
                onPress={() => router.navigate("/account")}
            />
        </View>
    );
}
