import { Text, View } from "react-native";
import type { ReactNode } from "react";
import { ui } from "@/constants/market-theme";
import { Button } from "./Button";
import { ResourceStateSkeleton } from "./ResourceStateSkeleton";

export function ResourceState({
    loading,
    error,
    retry,
    empty,
    data,
    updatedAt,
    loadingFallback,
}: {
    loading: boolean;
    error: string;
    retry: () => void;
    empty?: string;
    data?: unknown;
    updatedAt?: number | null;
    loadingFallback?: ReactNode;
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
    if (loading && loadingFallback) return loadingFallback;
    if (loading) return <ResourceStateSkeleton />;
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
