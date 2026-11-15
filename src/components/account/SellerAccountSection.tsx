import { ActivityIndicator, Text, View } from "react-native";
import { router } from "expo-router";
import { AccountRow, AccountSection } from "./AccountMenu";
import { SellerAccountSkeleton } from "./SellerAccountSkeleton";
import { account } from "@/constants/account-styles";
import { palette, statusLabel } from "@/constants/market-theme";
import type { SellerAccount } from "@/types/marketplace";
type Tone = "neutral" | "review" | "success" | "attention" | "danger";

function StatusPill({ label, tone }: { label: string; tone: Tone }) {
    return (
        <View
            style={[
                account.status,
                tone === "review" && account.statusReview,
                tone === "success" && account.statusSuccess,
                tone === "attention" && account.statusAttention,
                tone === "danger" && account.statusDanger,
            ]}
        >
            <Text
                style={[
                    account.statusText,
                    tone === "review" && account.statusReviewText,
                    tone === "success" && account.statusSuccessText,
                    tone === "attention" && account.statusAttentionText,
                    tone === "danger" && account.dangerText,
                ]}
            >
                {label}
            </Text>
        </View>
    );
}

export function SellerAccountSection({
    data,
    loading,
    refreshing = false,
    error,
    onRetry,
}: {
    data: SellerAccount | null;
    loading: boolean;
    refreshing?: boolean;
    error: string;
    onRetry: () => void;
}) {
    const store = data?.store;
    const application = data?.application;

    return (
        <AccountSection title="Selling">
            {loading && !data ? (
                <SellerAccountSkeleton />
            ) : error && !data ? (
                <>
                    <Text accessibilityRole="alert" style={account.sellerError}>
                        {error}
                    </Text>
                    <AccountRow
                        icon="refresh-cw"
                        title="Try again"
                        onPress={onRetry}
                        trailingIcon={null}
                    />
                </>
            ) : store ? (
                <>
                    <AccountRow
                        icon="briefcase"
                        title="My Store"
                        description={store.name}
                        accessibilityLabel={`My Store, ${store.name}, ${
                            store.status === "active"
                                ? "Active"
                                : "Suspended"
                        }`}
                        onPress={() => router.push("/selling")}
                        trailingIcon={null}
                        titleAccessory={
                            <StatusPill
                                label={
                                    store.status === "active"
                                        ? "Active"
                                        : "Suspended"
                                }
                                tone={
                                    store.status === "active" ? "success" : "danger"
                                }
                            />
                        }
                    />
                    {!!store.reason && (
                        <View style={account.statusBody}>
                            <Text style={account.message}>{store.reason}</Text>
                        </View>
                    )}
                </>
            ) : application ? (
                <>
                    <AccountRow
                        icon={
                            application.status === "more-info"
                                ? "edit-3"
                                : "file-text"
                        }
                        title={
                            application.status === "more-info"
                                ? "Update application"
                                : "Seller application"
                        }
                        description={application.businessName}
                        onPress={() => router.push("/application")}
                    />
                    <View style={account.statusBody}>
                        <StatusPill
                            label={statusLabel(application.status)}
                            tone={
                                application.status === "approved"
                                    ? "success"
                                    : application.status === "more-info"
                                      ? "attention"
                                      : application.status === "rejected"
                                        ? "danger"
                                        : "review"
                            }
                        />
                        {!!application.reason ? (
                            <Text style={account.message}>
                                {application.reason}
                            </Text>
                        ) : (
                            application.status === "pending" && (
                                <Text style={account.message}>
                                    Your application is under review.
                                </Text>
                            )
                        )}
                    </View>
                </>
            ) : data ? (
                <AccountRow
                    icon="briefcase"
                    title="Start selling"
                    description="Apply to open your store"
                    onPress={() => router.push("/application")}
                />
            ) : null}
            {data && refreshing && (
                <View style={account.statusRefreshing} accessible accessibilityLabel="Updating seller status" accessibilityLiveRegion="polite">
                    <ActivityIndicator size="small" color={palette.muted} accessible={false} />
                    <Text style={account.statusRefreshingText}>Updating status</Text>
                </View>
            )}
        </AccountSection>
    );
}
