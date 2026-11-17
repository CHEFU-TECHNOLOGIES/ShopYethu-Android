import { DebouncedPressable as Pressable } from "@/components/ui/DebouncedPressable";
import {
    ProductGalleryActionsDropdown,
    type ProductGalleryActionsAnchor,
} from "@/components/market/ProductGalleryActionsDropdown";
import { useProductGalleryActions } from "@/components/market/useProductGalleryActions";
import type { Product, Storefront } from "@/types/marketplace";
import { Ionicons } from "@expo/vector-icons";
import { useRef, useState, type ComponentRef } from "react";
import { StyleSheet } from "react-native";

export function ProductGalleryActionsMenu({
    product,
    store,
}: {
    product: Product;
    store: Storefront;
}) {
    const [open, setOpen] = useState(false);
    const [anchor, setAnchor] = useState<ProductGalleryActionsAnchor | null>(
        null,
    );
    const trigger = useRef<ComponentRef<typeof Pressable>>(null);
    const { share, report, copyLink } = useProductGalleryActions(
        product,
        store,
        () => setOpen(false),
    );

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
            <ProductGalleryActionsDropdown
                visible={open}
                anchor={anchor}
                onDismiss={() => setOpen(false)}
                onShare={share}
                onCopyLink={() => void copyLink()}
                onReport={report}
            />
        </>
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
});
