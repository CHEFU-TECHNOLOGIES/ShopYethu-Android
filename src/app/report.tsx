import { useRef, useState } from "react";
import { Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import {
    Button,
    Field,
    Page,
    SignInNotice,
} from "@/components/market/Primitives";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { ui } from "@/constants/market-theme";
import { toast } from "@/lib/toast";

export default function ReportScreen() {
    const { productId, orderId } = useLocalSearchParams<{
        productId?: string;
        orderId?: string;
    }>();
    const { session } = useAuth();
    const [message, setMessage] = useState(""),
        [busy, setBusy] = useState(false),
        [reference, setReference] = useState(""),
        [error, setError] = useState("");
    const locked = useRef(false);
    async function submit() {
        if (locked.current) return;
        locked.current = true;
        setBusy(true);
        setError("");
        try {
            const report = await api<{ id: string }>("/reports", {
                method: "POST",
                body: JSON.stringify({
                    ...(orderId ? { orderId } : { productId }),
                    message,
                }),
            });
            setReference(report.id);
        } catch (cause) {
            setError((cause as Error).message);
            toast.error((cause as Error).message);
        } finally {
            locked.current = false;
            setBusy(false);
        }
    }
    return (
        <Page
            title={orderId ? "Tell us what happened." : "Report a listing"}
            subtitle="Our staff will review your report."
            back
        >
            {!session ? (
                <SignInNotice />
            ) : reference ? (
                <View style={ui.card}>
                    <Text style={ui.heading}>Report received</Text>
                    <Text style={ui.body}>Reference: {reference}</Text>
                    <Text style={ui.subtitle}>
                        Your report is open for our staff to follow up.
                    </Text>
                </View>
            ) : (
                <>
                    <Field
                        label="What should we know?"
                        value={message}
                        onChangeText={setMessage}
                        multiline
                        editable={!busy}
                    />
                    <Text style={ui.small}>
                        Include useful details, but never share passwords or
                        payment card information.
                    </Text>
                    {error && (
                        <Text accessibilityRole="alert" style={ui.error}>
                            {error}
                        </Text>
                    )}
                    <Button
                        title={busy ? "Submitting…" : "Send report"}
                        disabled={busy || message.trim().length < 10}
                        onPress={() => void submit()}
                    />
                </>
            )}
        </Page>
    );
}
