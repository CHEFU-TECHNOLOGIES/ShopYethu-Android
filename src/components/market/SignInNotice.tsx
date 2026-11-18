import { Text, View } from "react-native";
import Feather from "@expo/vector-icons/Feather";
import { palette, ui } from "@/constants/market-theme";
import { useAuth } from "@/lib/auth";
import { Button } from "./Button";

export function SignInNotice({
    title = "Make yourself at home",
    subtitle = "Sign in to start a basket, track orders, or start selling.",
}: {
    title?: string;
    subtitle?: string;
}) {
    const { signIn, busy } = useAuth();

    return (
        <View style={ui.card}>
            <Text style={ui.heading}>{title}</Text>
            <Text style={ui.subtitle}>{subtitle}</Text>
            <Button
                title={busy ? "Signing in…" : "Sign in"}
                onPress={() => void signIn()}
                disabled={busy}
                loading={busy}
                trailingIcon={!busy && (
                    <Feather
                        name="external-link"
                        size={16}
                        color={palette.paper}
                        accessible={false}
                    />
                )}
            />
        </View>
    );
}
