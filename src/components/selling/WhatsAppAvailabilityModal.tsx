import { useState } from "react";
import { Modal, StyleSheet, Text, View } from "react-native";
import { Button } from "@/components/market/Primitives";
import { Choice } from "@/components/application/ApplicationChoices";
import { palette, ui } from "@/constants/market-theme";

export function WhatsAppAvailabilityModal({
    visible,
    whatsappAvailable,
    onConfirm,
    onCancel,
}: {
    visible: boolean;
    whatsappAvailable: boolean;
    onConfirm: (available: boolean) => void;
    onCancel: () => void;
}) {
    const [available, setAvailable] = useState(whatsappAvailable);

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onCancel}
        >
            <View style={styles.backdrop}>
                <View style={styles.card}>
                    <Text style={ui.heading}>
                        Is this number available on WhatsApp?
                    </Text>
                    <Text style={ui.small}>
                        Your phone number will be publicly visible on your
                        storefront so shoppers can contact you.
                    </Text>
                    <Choice
                        label="Yes"
                        selected={available}
                        onPress={() => setAvailable(true)}
                        disabled={false}
                    />
                    <Choice
                        label="No"
                        selected={!available}
                        onPress={() => setAvailable(false)}
                        disabled={false}
                    />
                    <View style={styles.actions}>
                        <View style={styles.cancelAction}>
                            <Button
                                title="Cancel"
                                secondary
                                compact
                                inline
                                onPress={onCancel}
                            />
                        </View>
                        <View style={styles.saveAction}>
                            <Button
                                title="Save contact number"
                                compact
                                inline
                                onPress={() => onConfirm(available)}
                            />
                        </View>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        justifyContent: "center",
        padding: 20,
        backgroundColor: "rgba(0, 0, 0, 0.45)",
    },
    card: {
        gap: 14,
        padding: 20,
        borderRadius: 18,
        backgroundColor: palette.paper,
    },
    actions: { flexDirection: "row", alignItems: "center", gap: 10 },
    saveAction: { flex: 1.4 },
    cancelAction: { flex: 1 },
});
