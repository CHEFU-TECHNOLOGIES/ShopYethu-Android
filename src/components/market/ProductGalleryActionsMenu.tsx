import { DebouncedPressable as Pressable } from "@/components/ui/DebouncedPressable";
import { palette } from "@/constants/market-theme";
import { toast } from "@/lib/toast";
import { shareProduct } from "@/lib/product-sharing";
import type { Product, Storefront } from "@/types/marketplace";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useRef, useState, type ComponentRef } from "react";
import {
    Modal,
    StyleSheet,
    Text,
    useWindowDimensions,
    View,
} from "react-native";

export function ProductGalleryActionsMenu({
    product,
    store,
}: {
    product: Product;
    store: Storefront;
}) {
    const [open, setOpen] = useState(false);
    const [anchor, setAnchor] = useState<{
        x: number;
        y: number;
        width: number;
        height: number;
    } | null>(null);
    const trigger = useRef<ComponentRef<typeof Pressable>>(null);
    const sharing = useRef(false);
    const { width: windowWidth } = useWindowDimensions();

    function toggleMenu() {
        if (open) {
            setOpen(false);
            return;
        }
        trigger.current?.measureInWindow((x, y, width, height) => {
            setAnchor({ x, y, width, height });
            setOpen(true);
        });
    }

    function share() {
        setOpen(false);
        if (sharing.current) return;
        sharing.current = true;
        void shareProduct(product, store)
            .catch((cause: unknown) => {
                toast.error(
                    cause instanceof Error
                        ? cause.message
                        : "Could not share this product. Please try again.",
                );
            })
            .finally(() => {
                sharing.current = false;
            });
    }

    function report() {
        setOpen(false);
        router.navigate({
            pathname: "/report",
            params: { productId: product.id },
        });
    }

    return (
        <>
            <Pressable
                ref={trigger}
                accessibilityRole="button"
                accessibilityLabel="More product image actions"
                accessibilityState={{ expanded: open }}
                onPress={toggleMenu}
                style={styles.trigger}
                hitSlop={6}
            >
                <Ionicons name="ellipsis-horizontal" size={18} color="#FFFFFF" />
            </Pressable>
            <Modal
                visible={open}
                transparent
                animationType="none"
                statusBarTranslucent
                onRequestClose={() => setOpen(false)}
            >
                <View style={styles.modalRoot}>
                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Close product actions"
                        style={styles.dismiss}
                        onPress={() => setOpen(false)}
                    />
                    {anchor && (
                        <View
                            style={[
                                styles.dropdown,
                                {
                                    top: anchor.y + anchor.height + 6,
                                    right: Math.max(
                                        8,
                                        windowWidth - anchor.x - anchor.width,
                                    ),
                                },
                            ]}
                        >
                            <ActionItem
                                icon="share-outline"
                                label="Share"
                                onPress={share}
                            />
                            <ActionItem
                                icon="flag-outline"
                                label="Report"
                                onPress={report}
                            />
                        </View>
                    )}
                </View>
            </Modal>
        </>
    );
}

function ActionItem({
    icon,
    label,
    onPress,
}: {
    icon: "share-outline" | "flag-outline";
    label: string;
    onPress: () => void;
}) {
    return (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${label} product`}
            style={styles.item}
            onPress={onPress}
        >
            <Ionicons name={icon} size={19} color={palette.brand} />
            <Text style={styles.label}>{label}</Text>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    trigger: {
        position: "absolute",
        top: 12,
        right: 12,
        zIndex: 2,
        elevation: 3,
        width: 36,
        height: 36,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 18,
        backgroundColor: "rgba(32, 59, 49, 0.86)",
    },
    modalRoot: { flex: 1 },
    dismiss: { ...StyleSheet.absoluteFill },
    dropdown: {
        position: "absolute",
        zIndex: 2,
        elevation: 8,
        width: 145,
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
    label: { color: palette.ink, fontSize: 14, fontWeight: "600" },
});
