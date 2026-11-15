import type { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";
import { ui } from "@/constants/market-theme";

export function Button({
    title,
    onPress,
    secondary = false,
    disabled = false,
    testID,
    trailingIcon,
}: {
    title: string;
    onPress: () => void;
    secondary?: boolean;
    disabled?: boolean;
    testID?: string;
    trailingIcon?: ReactNode;
}) {
    return (
        <Pressable
            testID={testID}
            accessibilityRole="button"
            accessibilityLabel={title}
            accessibilityState={{ disabled }}
            disabled={disabled}
            onPress={onPress}
            style={({ pressed }) => [
                ui.button,
                secondary && ui.secondary,
                (disabled || pressed) && ui.disabled,
            ]}
        >
            <View style={ui.row}>
                <Text style={[ui.buttonText, secondary && ui.secondaryText]}>
                    {title}
                </Text>
                {trailingIcon}
            </View>
        </Pressable>
    );
}
