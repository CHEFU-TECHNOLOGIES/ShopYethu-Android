import { Button } from "@/components/market/Primitives";
import { applicationStyles as styles } from "@/constants/application-styles";
import { statusLabel, ui } from "@/constants/market-theme";
import type { SellerApplication, Storefront } from "@/types/marketplace";
import { router } from "expo-router";
import { Text, View } from "react-native";

function date(value: string) {
    const parsed = new Date(value);
    return Number.isFinite(parsed.getTime())
        ? parsed.toLocaleString("en-ZA", {
              dateStyle: "medium",
              timeStyle: "short",
          })
        : "Date unavailable";
}
export function ApplicationStatus({
    application,
    store,
    onEdit,
}: {
    application: SellerApplication;
    store: Storefront | null;
    onEdit: () => void;
}) {
    const events = application.history?.length
        ? application.history
        : [
              {
                  status: application.status,
                  at: application.updatedAt,
                  reason: application.reason,
              },
          ];
    const descriptions = {
        pending:
            "Your application is with our team. You can keep shopping while we review it.",
        "more-info":
            "Our team needs a little more information. Update your application and send a response.",
        approved: "Your seller application has been approved.",
        rejected:
            "Your application was not approved. Read the update from our team below.",
    };
    return (
        <>
            <View style={ui.card}>
                <Text style={ui.heading}>
                    {statusLabel(application.status)}
                </Text>
                <Text style={ui.subtitle}>
                    {descriptions[application.status]}
                </Text>
                {!!application.reason && application.status !== "pending" && (
                    <Text style={styles.detail}>{application.reason}</Text>
                )}
                {application.status === "more-info" && (
                    <Button title="Update application" onPress={onEdit} />
                )}
                {application.status === "approved" &&
                    store?.status === "active" && (
                        <Button
                            title="Open My Store"
                            onPress={() => router.navigate("/selling")}
                        />
                    )}
                {store?.status === "suspended" && (
                    <Text style={ui.error}>
                        Selling is suspended.
                        {store.reason ? ` ${store.reason}` : ""}
                    </Text>
                )}
                
            </View>
            <View style={ui.card}>
                <Text style={ui.heading}>Application updates</Text>
                {application.createdAt && (
                    <Text style={ui.small}>
                        First submitted {date(application.createdAt)}
                    </Text>
                )}
                {!application.history?.length && (
                    <Text style={ui.small}>
                        Showing the latest recorded update.
                    </Text>
                )}
                {[...events].reverse().map((event, index) => (
                    <View key={`${event.at}:${index}`} style={styles.event}>
                        <View style={styles.eventRail}>
                            <View style={styles.dot} />
                            {index < events.length - 1 && (
                                <View style={styles.stem} />
                            )}
                        </View>
                        <View style={styles.eventBody}>
                            <Text style={styles.detail}>
                                {event.status === "pending"
                                    ? event.response
                                        ? "Application resubmitted"
                                        : "Application submitted"
                                    : statusLabel(event.status)}
                            </Text>
                            <Text style={ui.small}>{date(event.at)}</Text>
                            {!!event.reason && (
                                <Text style={styles.detail}>
                                    {event.reason}
                                </Text>
                            )}
                            {!!event.response && (
                                <Text style={styles.detail}>
                                    Your response: {event.response}
                                </Text>
                            )}
                        </View>
                    </View>
                ))}
            </View>
        </>
    );
}
