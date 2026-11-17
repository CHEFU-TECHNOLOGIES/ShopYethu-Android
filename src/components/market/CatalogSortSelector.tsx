import { useRef, useState, type ComponentRef } from "react";
import { Ionicons } from "@expo/vector-icons";
import { DebouncedPressable as Pressable } from "@/components/ui/DebouncedPressable";
import { palette } from "@/constants/market-theme";
import type { CatalogSort } from "@/types/marketplace";
import {
    Modal,
    StyleSheet,
    Text,
    useWindowDimensions,
    View,
} from "react-native";

const options = [
    { value: "newest", label: "Newest" },
    { value: "price-low", label: "Lowest price" },
    { value: "price-high", label: "Highest price" },
] as const;

export function CatalogSortSelector({
    value,
    onChange,
}: {
    value: CatalogSort;
    onChange: (value: CatalogSort) => void;
}) {
    const trigger = useRef<ComponentRef<typeof Pressable>>(null);
    const [visible, setVisible] = useState(false);
    const [anchor, setAnchor] = useState({ x: 0, y: 0, width: 0, height: 0 });
    const { width: windowWidth } = useWindowDimensions();
    const selected = options.find((option) => option.value === value) || options[0];

    function open() {
        trigger.current?.measureInWindow((x, y, width, height) => {
            setAnchor({ x, y, width, height });
            setVisible(true);
        });
    }

    return (
        <>
            <Pressable
                ref={trigger}
                accessibilityRole="button"
                accessibilityLabel={`Sort by, ${selected.label}`}
                accessibilityState={{ expanded: visible }}
                onPress={open}
                style={styles.trigger}
            >
                <Text style={styles.triggerLabel}>
                    Sort by · {selected.label}
                </Text>
                <Ionicons
                    name="chevron-down"
                    size={15}
                    color={palette.brand}
                    accessible={false}
                />
            </Pressable>
            <Modal
                visible={visible}
                transparent
                animationType="none"
                statusBarTranslucent
                onRequestClose={() => setVisible(false)}
            >
                <View style={styles.modalRoot}>
                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Close sort options"
                        style={StyleSheet.absoluteFill}
                        onPress={() => setVisible(false)}
                    />
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
                        {options.map((option) => (
                            <Pressable
                                key={option.value}
                                accessibilityRole="radio"
                                accessibilityState={{
                                    checked: option.value === value,
                                }}
                                onPress={() => {
                                    onChange(option.value);
                                    setVisible(false);
                                }}
                                style={styles.option}
                            >
                                <Text
                                    style={[
                                        styles.optionLabel,
                                        option.value === value &&
                                            styles.selectedLabel,
                                    ]}
                                >
                                    {option.label}
                                </Text>
                                {option.value === value && (
                                    <Ionicons
                                        name="checkmark"
                                        size={18}
                                        color={palette.brand}
                                        accessible={false}
                                    />
                                )}
                            </Pressable>
                        ))}
                    </View>
                </View>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    modalRoot: { flex: 1 },
    trigger: {
        minHeight: 40,
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
    },
    triggerLabel: { color: palette.brand, fontSize: 12, fontWeight: "700" },
    dropdown: {
        position: "absolute",
        zIndex: 2,
        elevation: 8,
        minWidth: 160,
        paddingVertical: 5,
        borderRadius: 12,
        backgroundColor: palette.paper,
        shadowColor: "#000000",
        shadowOpacity: 0.16,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 5 },
    },
    option: {
        minHeight: 46,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        paddingHorizontal: 12,
    },
    optionLabel: { color: palette.ink, fontSize: 14, fontWeight: "600" },
    selectedLabel: { color: palette.brand },
});
