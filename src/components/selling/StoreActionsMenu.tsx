import { DebouncedPressable as Pressable } from "@/components/ui/DebouncedPressable";
import { palette } from "@/constants/market-theme";
import { toast } from "@/lib/toast";
import { shareStore } from "@/lib/store-sharing";
import type { Storefront } from "@/types/marketplace";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useRef } from "react";
import { StyleSheet, Text, View } from "react-native";

export function StoreActionsMenu({
    store,
    open,
    onOpenChange,
}: {
    store: Storefront;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const sharing = useRef(false);

    function share() {
        onOpenChange(false);
        if (sharing.current) return;
        sharing.current = true;
        void shareStore(store)
            .catch((cause: unknown) => {
                toast.error(
                    cause instanceof Error
                        ? cause.message
                        : "Could not share your storefront. Please try again.",
                );
            })
            .finally(() => {
                sharing.current = false;
            });
    }

    return (
        <>
            <Pressable
                accessibilityRole="button"
                accessibilityLabel="More storefront actions"
                accessibilityHint="Shows edit and share options"
                accessibilityState={{ expanded: open }}
                onPress={() => onOpenChange(!open)}
                style={styles.trigger}
                hitSlop={6}
            >
                <Ionicons
                    name="ellipsis-horizontal"
                    size={18}
                    color="#FFFFFF"
                />
            </Pressable>
            {open && (
                <>
                    <Pressable
                        style={styles.dismiss}
                        onPress={() => onOpenChange(false)}
                        accessible={false}
                    />
                    <View style={styles.dropdown}>
                        <Pressable
                            accessibilityRole="button"
                            accessibilityLabel="Edit storefront"
                            style={styles.item}
                            onPress={() => {
                                onOpenChange(false);
                                router.navigate("/selling/store");
                            }}
                        >
                            <Ionicons
                                name="create-outline"
                                size={19}
                                color={palette.ink}
                            />
                            <Text style={styles.label}>Edit</Text>
                        </Pressable>
                        <Pressable
                            accessibilityRole="button"
                            accessibilityLabel="Share storefront"
                            style={styles.item}
                            onPress={share}
                        >
                            <Ionicons
                                name="share-outline"
                                size={19}
                                color={palette.brand}
                            />
                            <Text style={styles.label}>Share</Text>
                        </Pressable>
                    </View>
                </>
            )}
        </>
    );
}

const styles = StyleSheet.create({
    trigger: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#365F4D",
    },
    dismiss: {
        ...StyleSheet.absoluteFill,
        zIndex: 1,
    },
    dropdown: {
        position: "absolute",
        top: 62,
        right: 16,
        zIndex: 2,
        elevation: 8,
        width: 150,
        paddingVertical: 5,
        borderRadius: 12,
        backgroundColor: palette.paper,
        shadowColor: "#000000",
        shadowOpacity: 0.16,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 5 },
    },
    item: {
        minHeight: 46,
        flexDirection: "row",
        alignItems: "center",
        gap: 9,
        paddingHorizontal: 12,
    },
    label: {
        color: palette.ink,
        fontSize: 14,
        fontWeight: "600",
    },
});
