import { Modal, StyleSheet, Text, View } from "react-native";
import { DebouncedPressable as Pressable } from "@/components/ui/DebouncedPressable";
import { palette } from "@/constants/market-theme";

export function ConfirmationDialog({
    visible,
    title,
    message,
    cancelLabel = "Cancel",
    confirmLabel,
    destructive = false,
    onCancel,
    onConfirm,
}: {
    visible: boolean;
    title: string;
    message: string;
    cancelLabel?: string;
    confirmLabel: string;
    destructive?: boolean;
    onCancel: () => void;
    onConfirm: () => void;
}) {
    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            statusBarTranslucent
            onRequestClose={onCancel}
        >
            <View style={styles.backdrop}>
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Cancel confirmation"
                    style={StyleSheet.absoluteFill}
                    onPress={onCancel}
                />
                <View accessibilityViewIsModal style={styles.card}>
                    <Text accessibilityRole="header" style={styles.title}>
                        {title}
                    </Text>
                    <Text style={styles.message}>{message}</Text>
                    <View style={styles.actions}>
                        <Pressable
                            accessibilityRole="button"
                            style={[styles.button, styles.cancelButton]}
                            onPress={onCancel}
                        >
                            <Text style={styles.cancelLabel}>
                                {cancelLabel}
                            </Text>
                        </Pressable>
                        <Pressable
                            accessibilityRole="button"
                            style={[
                                styles.button,
                                destructive
                                    ? styles.destructiveButton
                                    : styles.confirmButton,
                            ]}
                            onPress={onConfirm}
                        >
                            <Text style={styles.confirmLabel}>
                                {confirmLabel}
                            </Text>
                        </Pressable>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        backgroundColor: "rgba(0, 0, 0, 0.42)",
    },
    card: {
        width: "100%",
        maxWidth: 380,
        gap: 12,
        padding: 20,
        borderRadius: 20,
        backgroundColor: palette.paper,
        elevation: 8,
        shadowColor: "#000000",
        shadowOpacity: 0.18,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 8 },
    },
    title: {
        color: palette.ink,
        fontFamily: "serif",
        fontSize: 22,
        fontWeight: "700",
    },
    message: { color: palette.muted, fontSize: 14, lineHeight: 21 },
    actions: {
        flexDirection: "row",
        justifyContent: "flex-end",
        gap: 8,
        marginTop: 4,
    },
    button: {
        minHeight: 44,
        justifyContent: "center",
        paddingHorizontal: 14,
        borderRadius: 12,
    },
    cancelButton: { backgroundColor: palette.soft },
    confirmButton: { backgroundColor: palette.brand },
    destructiveButton: { backgroundColor: palette.danger },
    cancelLabel: { color: palette.brand, fontSize: 14, fontWeight: "700" },
    confirmLabel: { color: palette.paper, fontSize: 14, fontWeight: "700" },
});
