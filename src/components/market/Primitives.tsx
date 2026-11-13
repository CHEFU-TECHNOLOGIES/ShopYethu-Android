import type { ReactNode } from "react";
import {
    ActivityIndicator,
    Pressable,
    RefreshControl,
    ScrollView,
    Text,
    TextInput,
    View,
    type TextInputProps,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { palette, ui } from "@/constants/market-theme";

export function Page({
    title,
    subtitle,
    back = false,
    header,
    onRefresh,
    refreshing = false,
    children,
}: {
    title: string;
    subtitle?: string;
    back?: boolean;
    header?: ReactNode;
    onRefresh?: () => void;
    refreshing?: boolean;
    children: ReactNode;
}) {
    return (
        <SafeAreaView style={ui.page} edges={["top"]}>
            <ScrollView
                contentContainerStyle={ui.content}
                keyboardShouldPersistTaps="handled"
                refreshControl={onRefresh ? (
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={[palette.brand]}
                        tintColor={palette.brand}
                    />
                ) : undefined}
            >
                {back && (
                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Go back"
                        onPress={() =>
                            router.canGoBack()
                                ? router.back()
                                : router.replace("/")
                        }
                    >
                        <Text style={ui.badge}>‹ Back</Text>
                    </Pressable>
                )}
                {header ?? <View style={{ gap: 5 }}>
                    <Text style={ui.title}>{title}</Text>
                    {subtitle && <Text style={ui.subtitle}>{subtitle}</Text>}
                </View>}
                {children}
            </ScrollView>
        </SafeAreaView>
    );
}
export function Button({
    title,
    onPress,
    secondary = false,
    disabled = false,
    testID,
    trailingIcon,
}: {
    title: string;
    onPress: () => void;
    secondary?: boolean;
    disabled?: boolean;
    testID?: string;
    trailingIcon?: ReactNode;
}) {
    return (
        <Pressable
            testID={testID}
            accessibilityRole="button"
            accessibilityLabel={title}
            accessibilityState={{ disabled }}
            disabled={disabled}
            onPress={onPress}
            style={({ pressed }) => [
                ui.button,
                secondary && ui.secondary,
                (disabled || pressed) && ui.disabled,
            ]}
        >
            <View style={ui.row}>
                <Text style={[ui.buttonText, secondary && ui.secondaryText]}>
                    {title}
                </Text>
                {trailingIcon}
            </View>
        </Pressable>
    );
}
export function Field({ label, ...props }: TextInputProps & { label: string }) {
    return (
        <View style={{ gap: 7 }}>
            <Text style={[ui.small, { fontWeight: "600" }]}>{label}</Text>
            <TextInput
                accessibilityLabel={label}
                placeholderTextColor={palette.muted}
                style={[
                    ui.input,
                    props.multiline && {
                        minHeight: 94,
                        textAlignVertical: "top",
                    },
                ]}
                {...props}
            />
        </View>
    );
}
export function ResourceState({
    loading,
    error,
    retry,
    empty,
}: {
    loading: boolean;
    error: string;
    retry: () => void;
    empty?: string;
}) {
    if (loading)
        return (
            <View style={ui.card}>
                <ActivityIndicator color={palette.brand} />
                <Text style={ui.small}>Loading…</Text>
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
export function SignInNotice() {
    return (
        <View style={ui.card}>
            <Text style={ui.heading}>Make yourself at home</Text>
            <Text style={ui.subtitle}>
                Sign in to start a basket, track orders, or start selling.
            </Text>
            <Button
                title="Go to account"
                onPress={() => router.push("/account")}
            />
        </View>
    );
}
