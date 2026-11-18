import type { ReactNode } from "react";
import { RefreshControl, Text, View } from "react-native";
import { DebouncedPressable as Pressable } from "@/components/ui/DebouncedPressable";
import { SafeAreaView } from "react-native-safe-area-context";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { router } from "expo-router";
import { palette, ui } from "@/constants/market-theme";

export function Page({
    title,
    subtitle,
    back = false,
    backAccessory,
    header,
    headerRight,
    onRefresh,
    refreshing = false,
    children,
}: {
    title: string;
    subtitle?: string;
    back?: boolean;
    backAccessory?: ReactNode;
    header?: ReactNode;
    headerRight?: ReactNode;
    onRefresh?: () => void;
    refreshing?: boolean;
    children: ReactNode;
}) {
    const backButton = (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={() =>
                router.canGoBack() ? router.back() : router.replace("/")
            }
        >
            <Text style={ui.badge}>‹ Back</Text>
        </Pressable>
    );
    return (
        <SafeAreaView style={ui.page} edges={["top"]}>
            <KeyboardAwareScrollView
                style={{ flex: 1 }}
                bottomOffset={24}
                contentContainerStyle={ui.content}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
                refreshControl={
                    onRefresh ? (
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={[palette.brand]}
                            tintColor={palette.brand}
                        />
                    ) : undefined
                }
            >
                {back &&
                    (backAccessory ? (
                        <View
                            style={[
                                ui.row,
                                { justifyContent: "space-between" },
                            ]}
                        >
                            {backButton}
                            {backAccessory}
                        </View>
                    ) : (
                        backButton
                    ))}
                {header ?? (
                    <View style={{ gap: 5 }}>
                        {headerRight ? (
                            <View
                                style={{
                                    flexDirection: "row",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                }}
                            >
                                <Text style={[ui.title, { flexShrink: 1 }]}>
                                    {title}
                                </Text>
                                {headerRight}
                            </View>
                        ) : (
                            <Text style={ui.title}>{title}</Text>
                        )}
                        {subtitle && (
                            <Text style={ui.subtitle}>{subtitle}</Text>
                        )}
                    </View>
                )}
                {children}
            </KeyboardAwareScrollView>
        </SafeAreaView>
    );
}
