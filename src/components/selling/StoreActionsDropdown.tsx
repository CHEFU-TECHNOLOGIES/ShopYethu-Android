import { DebouncedPressable as Pressable } from "@/components/ui/DebouncedPressable";
import { palette } from "@/constants/market-theme";
import { Ionicons } from "@expo/vector-icons";
import {
    useRef,
    useState,
    type ComponentProps,
    type ComponentRef,
} from "react";
import {
    Modal,
    StyleSheet,
    Text,
    useWindowDimensions,
    View,
} from "react-native";

export function StoreActionsDropdown({
    open,
    onOpenChange,
    paused,
    onEdit,
    onShare,
    onCopy,
    onPause,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    paused: boolean;
    onEdit: () => void;
    onShare: () => void;
    onCopy: () => void;
    onPause: () => void;
}) {
    const trigger = useRef<ComponentRef<typeof Pressable>>(null);
    const [anchor, setAnchor] = useState<{
        x: number;
        y: number;
        width: number;
        height: number;
    } | null>(null);
    const { width: windowWidth } = useWindowDimensions();

    function toggleMenu() {
        if (open) {
            onOpenChange(false);
            return;
        }
        trigger.current?.measureInWindow((x, y, width, height) => {
            setAnchor({ x, y, width, height });
            onOpenChange(true);
        });
    }

    return (
        <>
            <Pressable
                accessibilityRole="button"
                accessibilityLabel="More storefront actions"
                accessibilityHint="Shows storefront actions"
                accessibilityState={{ expanded: open }}
                onPress={toggleMenu}
                style={styles.trigger}
                hitSlop={6}
                ref={trigger}
            >
                <Ionicons
                    name="ellipsis-horizontal"
                    size={16}
                    color="#FFFFFF"
                />
            </Pressable>
            <Modal
                visible={open}
                transparent
                animationType="none"
                statusBarTranslucent
                onRequestClose={() => onOpenChange(false)}
            >
                <View style={styles.modalRoot}>
                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Close storefront actions"
                        style={styles.dismiss}
                        onPress={() => onOpenChange(false)}
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
                                icon="create-outline"
                                label="Edit"
                                accessibilityLabel="Edit storefront"
                                iconColor={palette.ink}
                                onPress={onEdit}
                            />
                            <ActionItem
                                icon="share-outline"
                                label="Share"
                                accessibilityLabel="Share storefront"
                                onPress={onShare}
                            />
                            <ActionItem
                                icon="link-outline"
                                label="Copy link"
                                accessibilityLabel="Copy storefront link"
                                onPress={onCopy}
                            />
                            <ActionItem
                                icon={
                                    paused
                                        ? "play-circle-outline"
                                        : "pause-circle-outline"
                                }
                                label={paused ? "Resume store" : "Pause store"}
                                accessibilityLabel={
                                    paused ? "Resume store" : "Pause store"
                                }
                                onPress={onPause}
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
    accessibilityLabel,
    iconColor = palette.brand,
    onPress,
}: {
    icon: ComponentProps<typeof Ionicons>["name"];
    label: string;
    accessibilityLabel: string;
    iconColor?: string;
    onPress: () => void;
}) {
    return (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel={accessibilityLabel}
            style={styles.item}
            onPress={onPress}
        >
            <Ionicons name={icon} size={19} color={iconColor} />
            <Text style={styles.label}>{label}</Text>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    trigger: {
        width: 34,
        height: 34,
        borderRadius: 18,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#365F4D",
    },
    modalRoot: { flex: 1 },
    dismiss: { ...StyleSheet.absoluteFill },
    dropdown: {
        position: "absolute",
        top: 62,
        right: 16,
        zIndex: 2,
        elevation: 8,
        width: 164,
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
