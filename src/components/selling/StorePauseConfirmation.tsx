import { DebouncedPressable as Pressable } from "@/components/ui/DebouncedPressable";
import { palette } from "@/constants/market-theme";
import { Modal, StyleSheet, Text, View } from "react-native";

export function StorePauseConfirmation({
    paused,
    visible,
    onDismiss,
    onConfirm,
}: {
    paused: boolean;
    visible: boolean;
    onDismiss: () => void;
    onConfirm: () => void;
}) {
    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            statusBarTranslucent
            onRequestClose={onDismiss}
        >
            <View style={styles.backdrop}>
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Cancel store status change"
                    style={styles.dismiss}
                    onPress={onDismiss}
                />
                <View accessibilityViewIsModal style={styles.card}>
                    <Text accessibilityRole="header" style={styles.title}>
                        {paused ? "Resume your store?" : "Pause your store?"}
                    </Text>
                    <Text style={styles.message}>
                        {paused
                            ? "Your storefront and products will be visible to customers again."
                            : "Your storefront and products will be hidden from customers until you resume."}
                    </Text>
                    <View style={styles.actions}>
                        <Pressable
                            accessibilityRole="button"
                            style={[styles.button, styles.cancelButton]}
                            onPress={onDismiss}
                        >
                            <Text style={styles.cancelLabel}>Cancel</Text>
                        </Pressable>
                        <Pressable
                            accessibilityRole="button"
                            style={[
                                styles.button,
                                paused ? styles.resumeButton : styles.pauseButton,
                            ]}
                            onPress={onConfirm}
                        >
                            <Text style={styles.actionLabel}>
                                {paused ? "Resume store" : "Pause store"}
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
    dismiss: { ...StyleSheet.absoluteFill },
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
    resumeButton: { backgroundColor: palette.brand },
    pauseButton: { backgroundColor: palette.danger },
    cancelLabel: { color: palette.brand, fontSize: 14, fontWeight: "700" },
    actionLabel: { color: palette.paper, fontSize: 14, fontWeight: "700" },
});
