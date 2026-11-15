import { Text, View } from "react-native";
import { router } from "expo-router";
import { ui } from "@/constants/market-theme";
import { Button } from "./Button";

export function SignInNotice() {
    return (
        <View style={ui.card}>
            <Text style={ui.heading}>Make yourself at home</Text>
            <Text style={ui.subtitle}>
                Sign in to start a basket, track orders, or start selling.
            </Text>
            <Button
                title="Go to account"
                onPress={() => router.navigate("/account")}
            />
        </View>
    );
}
