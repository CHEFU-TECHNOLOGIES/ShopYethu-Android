import { useState } from "react";
import { Modal, StyleSheet, Text, View } from "react-native";
import { Button, Field } from "@/components/market/Primitives";
import { palette, ui } from "@/constants/market-theme";
import {
    checkAccountPhoneCode,
    sendAccountPhoneCode,
    type PhoneVerificationReceipt,
} from "@/lib/account-phone";

export function PhoneVerificationModal({
    visible,
    phone,
    required = false,
    onVerified,
    onCancel,
}: {
    visible: boolean;
    phone: string;
    required?: boolean;
    onVerified: (receipt: PhoneVerificationReceipt) => void;
    onCancel: () => void;
}) {
    const [target, setTarget] = useState("");
    const [phoneValue, setPhoneValue] = useState(phone);
    const [code, setCode] = useState("");
    const [sent, setSent] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");

    async function send() {
        if (busy) return;
        setBusy(true);
        setError("");
        try {
            const result = await sendAccountPhoneCode(phoneValue);
            if (result.verified) {
                onVerified(result);
            } else {
                setTarget(result.phone);
                setCode("");
                setSent(true);
            }
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : "Could not send the SMS code.");
        } finally {
            setBusy(false);
        }
    }

    async function verify() {
        if (busy) return;
        if (!/^\d{4,10}$/.test(code)) {
            setError("Enter the numeric code from your text message.");
            return;
        }
        setBusy(true);
        setError("");
        try {
            onVerified(await checkAccountPhoneCode(target, code));
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : "Could not verify the phone number.");
        } finally {
            setBusy(false);
        }
    }

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={() => {
                if (!busy && !required) onCancel();
            }}
        >
            <View style={styles.backdrop}>
                <View style={styles.card}>
                    <Text style={ui.heading}>Verify your phone number</Text>
                    <Text style={ui.body}>
                        {sent
                            ? `Enter the SMS code sent to ${target}.`
                            : "We’ll verify this number before saving it to your shared CheFu account."}
                    </Text>
                    {sent ? (
                        <Field
                            label="SMS verification code"
                            placeholder="Enter code"
                            value={code}
                            onChangeText={(value) => setCode(value.replace(/\D/g, "").slice(0, 10))}
                            keyboardType="number-pad"
                            maxLength={10}
                            editable={!busy}
                        />
                    ) : (
                        <Field
                            label="Phone number"
                            onChangeText={setPhoneValue}
                            value={phoneValue}
                            editable={!busy}
                            keyboardType="phone-pad"
                            maxLength={30}
                            placeholder="e.g. 082 123 4567"
                        />
                    )}
                    {error ? (
                        <Text accessibilityRole="alert" style={ui.error}>
                            {error}
                        </Text>
                    ) : null}
                    <Button
                        title={busy ? "Please wait…" : sent ? "Verify phone number" : "Send verification code"}
                        disabled={busy || (!sent && !phoneValue.trim()) || (sent && code.length < 4)}
                        onPress={() => void (sent ? verify() : send())}
                    />
                    {sent ? (
                        <Button
                            title="Change number"
                            secondary
                            disabled={busy}
                            onPress={() => setSent(false)}
                        />
                    ) : null}
                    {sent ? (
                        <Button
                            title="Send a new code"
                            secondary
                            disabled={busy}
                            onPress={() => void send()}
                        />
                    ) : null}
                    <Button
                        title={required ? "Sign out" : "Cancel"}
                        secondary
                        disabled={busy}
                        onPress={onCancel}
                    />
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
});
