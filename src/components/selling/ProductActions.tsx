import { Modal, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { DebouncedPressable as Pressable } from "@/components/ui/DebouncedPressable";
import { Button } from "@/components/market/Button";
import { palette, ui } from "@/constants/market-theme";
import { useProductActions } from "@/hooks/use-product-actions";
import type { Product } from "@/types/marketplace";

export function ProductActions({
    product,
    onClose,
    onOptimistic,
    onSettled,
}: {
    product: Product;
    onClose: () => void;
    onOptimistic: (
        action: "draft" | "publish" | "delete",
        product: Product,
    ) => void;
    onSettled: (productId: string) => void;
}) {
    const insets = useSafeAreaInsets();
    const {
        confirmDelete,
        busy,
        error,
        close,
        editProduct,
        requestDeleteConfirmation,
        submit,
    } = useProductActions(product, onClose, onOptimistic, onSettled);

    return (
        <Modal
            transparent
            animationType="fade"
            visible
            onRequestClose={close}
            statusBarTranslucent
        >
            <View style={styles.overlay}>
                <Pressable
                    style={StyleSheet.absoluteFill}
                    onPress={close}
                    disabled={!!busy}
                    accessible={false}
                />
                <View
                    style={[
                        styles.sheet,
                        { paddingBottom: Math.max(insets.bottom, 16) + 12 },
                    ]}
                    accessibilityViewIsModal
                >
                    <ScrollView
                        bounces={false}
                        contentContainerStyle={styles.content}
                    >
                        <View style={styles.heading}>
                            <View style={styles.titleGroup}>
                                <Text
                                    accessibilityRole="header"
                                    style={styles.title}
                                >
                                    {confirmDelete
                                        ? "Delete product?"
                                        : "Manage product"}
                                </Text>
                                <Text style={ui.small} numberOfLines={2}>
                                    {product.name}
                                </Text>
                            </View>
                            <Pressable
                                accessibilityRole="button"
                                accessibilityLabel="Close product actions"
                                disabled={!!busy}
                                onPress={close}
                                style={styles.close}
                            >
                                <Ionicons
                                    name="close"
                                    size={22}
                                    color={palette.muted}
                                />
                            </Pressable>
                        </View>

                        {confirmDelete ? (
                            <>
                                <Text style={ui.body}>
                                    This removes the product from your store and
                                    the marketplace. Existing orders stay
                                    available. You cannot restore this product
                                    from the app.
                                </Text>
                                <Button
                                    title={
                                        busy === "delete"
                                            ? "Deleting product…"
                                            : "Delete product"
                                    }
                                    tone="danger"
                                    loading={busy === "delete"}
                                    disabled={!!busy}
                                    onPress={() => void submit("delete")}
                                />
                            </>
                        ) : (
                            <>
                                <Pressable
                                    accessibilityRole="button"
                                    style={styles.action}
                                    disabled={!!busy}
                                    onPress={editProduct}
                                >
                                    <Ionicons
                                        name="create-outline"
                                        size={21}
                                        color={palette.brand}
                                    />
                                    <Text style={styles.actionText}>
                                        Edit product
                                    </Text>
                                    <Ionicons
                                        name="chevron-forward"
                                        size={17}
                                        color={palette.muted}
                                    />
                                </Pressable>
                                {product.published ? (
                                    <Pressable
                                        accessibilityRole="button"
                                        accessibilityState={{
                                            disabled: !!busy,
                                            busy: busy === "draft",
                                        }}
                                        style={styles.action}
                                        disabled={!!busy}
                                        onPress={() => void submit("draft")}
                                    >
                                        <Ionicons
                                            name="archive-outline"
                                            size={21}
                                            color={palette.brand}
                                        />
                                        <Text style={styles.actionText}>
                                            {busy === "draft"
                                                ? "Moving to drafts…"
                                                : "Move to draft"}
                                        </Text>
                                        <Ionicons
                                            name="chevron-forward"
                                            size={17}
                                            color={palette.muted}
                                        />
                                    </Pressable>
                                ) : (
                                    <Pressable
                                        accessibilityRole="button"
                                        accessibilityState={{
                                            disabled: !!busy,
                                            busy: busy === "publish",
                                        }}
                                        style={styles.action}
                                        disabled={!!busy}
                                        onPress={() => void submit("publish")}
                                    >
                                        <Ionicons
                                            name="cloud-upload-outline"
                                            size={21}
                                            color={palette.brand}
                                        />
                                        <Text style={styles.actionText}>
                                            {busy === "publish"
                                                ? "Publishing…"
                                                : "Publish product"}
                                        </Text>
                                        <Ionicons
                                            name="chevron-forward"
                                            size={17}
                                            color={palette.muted}
                                        />
                                    </Pressable>
                                )}
                                <Pressable
                                    accessibilityRole="button"
                                    style={styles.action}
                                    disabled={!!busy}
                                    onPress={requestDeleteConfirmation}
                                >
                                    <Ionicons
                                        name="trash-outline"
                                        size={21}
                                        color={palette.danger}
                                    />
                                    <Text
                                        style={[
                                            styles.actionText,
                                            styles.danger,
                                        ]}
                                    >
                                        Delete product
                                    </Text>
                                </Pressable>
                            </>
                        )}
                        {!!error && (
                            <Text
                                accessibilityRole="alert"
                                accessibilityLiveRegion="polite"
                                style={ui.error}
                            >
                                {error}
                            </Text>
                        )}
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: "flex-end",
        backgroundColor: "rgba(17, 35, 26, 0.45)",
    },
    sheet: {
        backgroundColor: palette.paper,
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        padding: 22,
        maxHeight: "85%",
    },
    content: { gap: 16 },
    heading: { flexDirection: "row", alignItems: "center", gap: 12 },
    symbol: {
        width: 48,
        height: 48,
        borderRadius: 16,
        backgroundColor: palette.soft,
        alignItems: "center",
        justifyContent: "center",
    },
    dangerSoft: { backgroundColor: "#F9EAE7" },
    titleGroup: { flex: 1, gap: 4 },
    title: { fontSize: 20, color: palette.ink, fontWeight: "700" },
    close: {
        width: 44,
        height: 44,
        justifyContent: "center",
        alignItems: "center",
    },
    action: {
        minHeight: 52,
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingVertical: 10,
    },
    actionText: {
        flex: 1,
        color: palette.ink,
        fontSize: 15,
        fontWeight: "600",
    },
    danger: { color: palette.danger },
});
