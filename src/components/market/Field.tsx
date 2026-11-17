import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TextInput, View, type TextInputProps } from "react-native";
import { palette, ui } from "@/constants/market-theme";

export function Field({
    label,
    locked = false,
    style,
    ...props
}: TextInputProps & { label: string; locked?: boolean }) {
    return (
        <View style={{ gap: 7 }}>
            <View style={ui.between}>
                <Text style={[ui.small, { fontWeight: "600" }]}>{label}</Text>
                {locked && (
                    <View style={styles.lockLabel}>
                        <Ionicons name="lock-closed-outline" size={13} color={palette.muted} accessible={false} />
                        <Text style={ui.small}>Read only</Text>
                    </View>
                )}
            </View>
            <TextInput
                accessibilityLabel={label}
                placeholderTextColor={palette.muted}
                {...props}
                editable={locked ? false : props.editable}
                accessibilityHint={props.accessibilityHint ?? (locked ? "This field cannot be changed." : undefined)}
                style={[
                    ui.input,
                    props.multiline && {
                        minHeight: 94,
                        textAlignVertical: "top",
                    },
                    style,
                    locked && styles.lockedInput,
                ]}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    lockLabel: { flexDirection: "row", alignItems: "center", gap: 5 },
    lockedInput: { backgroundColor: palette.canvas, color: palette.muted },
});
