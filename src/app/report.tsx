import { Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import {
    Button,
    Field,
    Page,
    SignInNotice,
} from "@/components/market/Primitives";
import { useAuth } from "@/lib/auth";
import { ui } from "@/constants/market-theme";
import { useReportSubmission } from "@/hooks/use-report-submission";

export default function ReportScreen() {
    const { productId, orderId } = useLocalSearchParams<{
        productId?: string;
        orderId?: string;
    }>();
    const { session } = useAuth();
    const { message, setMessage, busy, reference, error, submit } =
        useReportSubmission(productId, orderId);
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
            ) : busy ? (
                <View style={ui.card} accessibilityLiveRegion="polite">
                    <Text style={ui.heading}>Sending your report</Text>
                    <Text style={ui.subtitle}>
                        Your report is not confirmed yet. Please wait while we send it.
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
                        tone="danger"
                        disabled={busy || message.trim().length < 10}
                        onPress={() => void submit()}
                    />
                </>
            )}
        </Page>
    );
}
