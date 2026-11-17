import type { ReactNode } from "react";
import { FlatList, Text, View, type FlatListProps } from "react-native";
import { DebouncedPressable as Pressable } from "@/components/ui/DebouncedPressable";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { ui } from "@/constants/market-theme";

export function ListPage<T>({
    title,
    back,
    header,
    children,
    ...props
}: Omit<FlatListProps<T>, "ListHeaderComponent"> & {
    title: string;
    back?: boolean;
    header?: ReactNode;
    children?: ReactNode;
}) {
    return (
        <SafeAreaView style={ui.page} edges={["top"]}>
            <FlatList
                {...props}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
                initialNumToRender={8}
                maxToRenderPerBatch={8}
                windowSize={7}
                contentContainerStyle={[ui.content, { gap: 14 }]}
                ListHeaderComponent={
                    <View style={{ gap: 18 }}>
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
                        <Text accessibilityRole="header" style={ui.title}>
                            {title}
                        </Text>
                        {header}
                    </View>
                }
            />
            {children}
        </SafeAreaView>
    );
}
