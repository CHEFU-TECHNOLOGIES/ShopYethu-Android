import type { ReactNode } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { DebouncedPressable } from "@/components/ui/DebouncedPressable";
import { palette, ui } from "@/constants/market-theme";
import { styles } from "./button.styles";

export function Button({
    title,
    onPress,
    secondary = false,
    tone,
    compact = false,
    inline = false,
    loading = false,
    disabled = false,
    testID,
    trailingIcon,
}: {
    title: string;
    onPress: () => void;
    secondary?: boolean;
    tone?: "primary" | "secondary" | "danger" | "quiet";
    compact?: boolean;
    inline?: boolean;
    loading?: boolean;
    disabled?: boolean;
    testID?: string;
    trailingIcon?: ReactNode;
}) {
    const resolvedTone = tone || (secondary ? "secondary" : "primary");

    return (
        <DebouncedPressable
            testID={testID}
            accessibilityRole="button"
            accessibilityLabel={title}
            accessibilityState={{ disabled: disabled || loading, busy: loading }}
            disabled={disabled || loading}
            onPress={onPress}
            style={({ pressed }) => [
                ui.button,
                resolvedTone === "secondary" && ui.secondary,
                resolvedTone === "danger" && styles.dangerButton,
                resolvedTone === "quiet" && styles.quietButton,
                compact && styles.compactButton,
                inline && styles.inlineButton,
                (disabled || loading || pressed) && ui.disabled,
            ]}
        >
            <View style={ui.row}>
                {loading && (
                    <ActivityIndicator
                        size="small"
                        color={
                            resolvedTone === "primary"
                                ? "#FFFFFF"
                                : resolvedTone === "danger"
                                  ? palette.danger
                                  : palette.brand
                        }
                        accessible={false}
                    />
                )}
                <Text
                    style={[
                        ui.buttonText,
                        (resolvedTone === "secondary" ||
                            resolvedTone === "quiet") &&
                            ui.secondaryText,
                        resolvedTone === "danger" && {
                            color: palette.danger,
                        },
                    ]}
                >
                    {title}
                </Text>
                {trailingIcon}
            </View>
        </DebouncedPressable>
    );
}
