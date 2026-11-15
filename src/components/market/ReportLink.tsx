import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text } from "react-native";
import { DebouncedPressable as Pressable } from "@/components/ui/DebouncedPressable";
import { palette } from "@/constants/market-theme";

export function ReportLink({
    title,
    onPress,
    inline = false,
    disabled = false,
}: {
    title: string;
    onPress: () => void;
    inline?: boolean;
    disabled?: boolean;
}) {
    return (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel={title}
            accessibilityState={{ disabled }}
            disabled={disabled}
            onPress={onPress}
            style={({ pressed }) => [
                styles.button,
                inline ? styles.inlineButton : styles.fullWidthButton,
                disabled && styles.disabled,
                pressed && !disabled && styles.pressed,
            ]}
        >
            <Ionicons
                name="flag-outline"
                size={15}
                color={palette.muted}
                accessible={false}
            />
            <Text style={styles.text}>{title}</Text>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    button: {
        minHeight: 44,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
    },
    fullWidthButton: {
        width: "100%",
        maxWidth: 640,
        alignSelf: "center",
    },
    inlineButton: { flex: 1 },
    disabled: { opacity: 0.5 },
    pressed: { opacity: 0.65 },
    text: { color: palette.muted, fontSize: 12, fontWeight: "600" },
});
