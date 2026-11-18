import { Ionicons } from "@expo/vector-icons";
import {
    StyleSheet,
    TextInput,
    View,
    type StyleProp,
    type TextInputProps,
    type ViewStyle,
} from "react-native";
import { DebouncedPressable as Pressable } from "@/components/ui/DebouncedPressable";
import { palette } from "@/constants/market-theme";

type Props = TextInputProps & {
    clearLabel?: string;
    containerStyle?: StyleProp<ViewStyle>;
};

export function ClearableTextInput({
    accessibilityLabel,
    clearLabel,
    containerStyle,
    editable,
    onChangeText,
    style,
    value,
    ...props
}: Props) {
    const showClear =
        typeof value === "string" &&
        value.length > 0 &&
        !!onChangeText &&
        editable !== false;

    return (
        <View style={[styles.container, containerStyle]}>
            <TextInput
                {...props}
                accessibilityLabel={accessibilityLabel}
                editable={editable}
                onChangeText={onChangeText}
                style={[style, showClear && styles.inputWithClear]}
                value={value}
            />
            {showClear && (
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Clear ${clearLabel || accessibilityLabel || "input"}`}
                    accessibilityHint="Clears this field."
                    hitSlop={8}
                    onPress={() => onChangeText?.("")}
                    style={styles.clearButton}
                >
                    <Ionicons
                        name="close-circle"
                        size={20}
                        color={palette.muted}
                        accessible={false}
                    />
                </Pressable>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { position: "relative" },
    inputWithClear: { paddingRight: 52 },
    clearButton: {
        position: "absolute",
        top: 4,
        right: 4,
        width: 40,
        height: 40,
        alignItems: "center",
        justifyContent: "center",
    },
});
