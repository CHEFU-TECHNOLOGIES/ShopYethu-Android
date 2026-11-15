import { ActivityIndicator, Text, View } from "react-native";
import { palette, ui } from "@/constants/market-theme";
import { Button } from "./Button";

export function ResourceState({
    loading,
    error,
    retry,
    empty,
    data,
    updatedAt,
}: {
    loading: boolean;
    error: string;
    retry: () => void;
    empty?: string;
    data?: unknown;
    updatedAt?: number | null;
}) {
    if (data !== null && data !== undefined) {
        if (error)
            return (
                <Text style={ui.small}>
                    Showing saved data
                    {updatedAt
                        ? ` · Updated ${new Date(updatedAt).toLocaleTimeString(
                              [],
                              { hour: "2-digit", minute: "2-digit" },
                          )}`
                        : ""}
                    . Pull to refresh or try again later.
                </Text>
            );
        return empty ? <Text style={ui.subtitle}>{empty}</Text> : null;
    }
    if (loading)
        return (
            <View
                accessibilityRole="progressbar"
                accessibilityLabel="Loading content"
                accessibilityLiveRegion="polite"
                style={[
                    ui.card,
                    {
                        flexDirection: "row",
                        alignItems: "center",
                        paddingVertical: 16,
                    },
                ]}
            >
                <View
                    style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: palette.soft,
                    }}
                >
                    <ActivityIndicator
                        size="small"
                        color={palette.brand}
                        accessible={false}
                    />
                </View>
                <View style={{ flex: 1, gap: 3 }}>
                    <Text style={[ui.body, { fontWeight: "700" }]}>
                        Loading content
                    </Text>
                    <Text style={ui.small}>
                        Please wait while we get things ready.
                    </Text>
                </View>
            </View>
        );
    if (error)
        return (
            <View style={ui.card}>
                <Text accessibilityRole="alert" style={ui.error}>
                    {error}
                </Text>
                <Button title="Try again" secondary onPress={retry} />
            </View>
        );
    return empty ? (
        <View style={ui.card}>
            <Text style={ui.subtitle}>{empty}</Text>
        </View>
    ) : null;
}
