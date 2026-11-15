import { Modal, Pressable, Text, View } from "react-native";
import { account } from "@/constants/account-styles";

export function SignOutConfirmation({
    visible,
    onCancel,
    onConfirm,
}: {
    visible: boolean;
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
            <View style={account.dialogOverlay}>
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Cancel sign out"
                    onPress={onCancel}
                    style={account.dialogBackdrop}
                />
                <View
                    accessibilityViewIsModal
                    style={account.dialog}
                >
                    <Text accessibilityRole="header" style={account.dialogTitle}>
                        Sign out?
                    </Text>
                    <Text style={account.dialogMessage}>
                        Are you sure you want to sign out of ShopYethu?
                    </Text>
                    <View style={account.dialogActions}>
                        <Pressable
                            accessibilityRole="button"
                            onPress={onCancel}
                            style={({ pressed }) => [
                                account.dialogButton,
                                account.dialogCancel,
                                pressed && account.pressed,
                            ]}
                        >
                            <Text style={account.dialogCancelText}>Cancel</Text>
                        </Pressable>
                        <Pressable
                            accessibilityRole="button"
                            onPress={onConfirm}
                            style={({ pressed }) => [
                                account.dialogButton,
                                account.dialogSignOut,
                                pressed && account.dialogSignOutPressed,
                            ]}
                        >
                            <Text style={account.dialogSignOutText}>
                                Sign out
                            </Text>
                        </Pressable>
                    </View>
                </View>
            </View>
        </Modal>
    );
}
