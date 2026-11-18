import { useRef, useState, type ComponentRef } from "react";
import {
    Modal,
    StyleSheet,
    Text,
    useWindowDimensions,
    View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { DebouncedPressable as Pressable } from "@/components/ui/DebouncedPressable";
import { palette } from "@/constants/market-theme";

export function OrderMoreOptionsDropdown({
    disabled = false,
    onReport,
    onShareQr,
    onRegenerateQr,
}: {
    disabled?: boolean;
    onReport: () => void;
    onShareQr?: () => void;
    onRegenerateQr?: () => void;
}) {
    const trigger = useRef<ComponentRef<typeof Pressable>>(null);
    const [open, setOpen] = useState(false);
    const [anchor, setAnchor] = useState<{
        x: number;
        y: number;
        width: number;
        height: number;
    } | null>(null);
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

    function report() {
        setOpen(false);
        onReport();
    }

    function regenerateQr() {
        setOpen(false);
        onRegenerateQr?.();
    }

    function shareQr() {
        setOpen(false);
        onShareQr?.();
    }

    return (
        <>
            <Pressable
                ref={trigger}
                accessibilityRole="button"
                accessibilityLabel="More order options"
                accessibilityHint="Shows more actions for this order"
                accessibilityState={{ expanded: open, disabled }}
                disabled={disabled}
                hitSlop={6}
                onPress={toggleMenu}
                style={styles.trigger}
            >
                <Ionicons
                    name="ellipsis-horizontal"
                    size={20}
                    color={palette.muted}
                    accessible={false}
                />
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
                        accessibilityLabel="Close order options"
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
                            {onShareQr && (
                                <Pressable
                                    accessibilityRole="button"
                                    accessibilityLabel="Share QR code"
                                    accessibilityState={{ disabled }}
                                    disabled={disabled}
                                    style={styles.item}
                                    onPress={shareQr}
                                >
                                    <Ionicons
                                        name="share-outline"
                                        size={19}
                                        color={palette.brand}
                                    />
                                    <Text style={styles.label}>
                                        Share QR code
                                    </Text>
                                </Pressable>
                            )}
                            {onRegenerateQr && (
                                <Pressable
                                    accessibilityRole="button"
                                    accessibilityLabel="Regenerate QR code"
                                    accessibilityState={{ disabled }}
                                    disabled={disabled}
                                    style={styles.item}
                                    onPress={regenerateQr}
                                >
                                    <Ionicons
                                        name="refresh-outline"
                                        size={19}
                                        color={palette.brand}
                                    />
                                    <Text style={styles.label}>
                                        Regenerate QR code
                                    </Text>
                                </Pressable>
                            )}
                            <Pressable
                                accessibilityRole="button"
                                accessibilityLabel="Report order issue"
                                accessibilityState={{ disabled }}
                                disabled={disabled}
                                style={styles.item}
                                onPress={report}
                            >
                                <Ionicons
                                    name="flag-outline"
                                    size={19}
                                    color={palette.danger}
                                />
                                <Text style={[styles.label, styles.reportLabel]}>
                                    Report order issue
                                </Text>
                            </Pressable>
                        </View>
                    )}
                </View>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    trigger: {
        width: 40,
        height: 40,
        alignItems: "center",
        justifyContent: "center",
        borderColor: palette.line,
        borderWidth: 1,
        borderRadius: 20,
    },
    modalRoot: { flex: 1 },
    dismiss: { ...StyleSheet.absoluteFill },
    dropdown: {
        position: "absolute",
        zIndex: 2,
        elevation: 8,
        width: 190,
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
    reportLabel: { color: palette.danger },
});
