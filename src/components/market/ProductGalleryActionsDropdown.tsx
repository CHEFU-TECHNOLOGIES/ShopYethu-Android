import { DebouncedPressable as Pressable } from "@/components/ui/DebouncedPressable";
import { palette } from "@/constants/market-theme";
import { Ionicons } from "@expo/vector-icons";
import {
    Modal,
    StyleSheet,
    Text,
    useWindowDimensions,
    View,
} from "react-native";

export type ProductGalleryActionsAnchor = {
    x: number;
    y: number;
    width: number;
    height: number;
};

export function ProductGalleryActionsDropdown({
    visible,
    anchor,
    onDismiss,
    onShare,
    onCopyLink,
    onReport,
    showReport = true,
}: {
    visible: boolean;
    anchor: ProductGalleryActionsAnchor | null;
    onDismiss: () => void;
    onShare: () => void;
    onCopyLink: () => void;
    onReport: () => void;
    showReport?: boolean;
}) {
    const { width: windowWidth } = useWindowDimensions();

    return (
        <Modal
            visible={visible}
            transparent
            animationType="none"
            statusBarTranslucent
            onRequestClose={onDismiss}
        >
            <View style={styles.modalRoot}>
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Close product actions"
                    style={styles.dismiss}
                    onPress={onDismiss}
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
                            onPress={onShare}
                        />
                        <ActionItem
                            icon="link-outline"
                            label="Copy link"
                            onPress={onCopyLink}
                        />
                        {showReport && (
                            <ActionItem
                                icon="flag-outline"
                                label="Report"
                                color={palette.danger}
                                onPress={onReport}
                            />
                        )}
                    </View>
                )}
            </View>
        </Modal>
    );
}

function ActionItem({
    icon,
    label,
    color = palette.brand,
    onPress,
}: {
    icon: "share-outline" | "link-outline" | "flag-outline";
    label: string;
    color?: string;
    onPress: () => void;
}) {
    return (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${label} product`}
            style={styles.item}
            onPress={onPress}
        >
            <Ionicons name={icon} size={19} color={color} />
            <Text style={[styles.label, { color }]}>{label}</Text>
        </Pressable>
    );
}

const styles = StyleSheet.create({
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
