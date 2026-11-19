import { Ionicons } from "@expo/vector-icons";
import { useState, type ReactNode } from "react";
import { Text, View } from "react-native";
import { DebouncedPressable as Pressable } from "@/components/ui/DebouncedPressable";
import { Field } from "@/components/market/Primitives";
import { palette, ui } from "@/constants/market-theme";
import type { Fulfilment } from "@/types/marketplace";
import { styles } from "./cart-styles";

export function CartCheckoutDetails({
    fulfilment,
    onSelectFulfilment,
    canCollect,
    contact,
    onContactChange,
    contactPlaceholder,
    address,
    onAddressChange,
    disabled,
    children,
}: {
    fulfilment: Fulfilment;
    onSelectFulfilment: (fulfilment: Fulfilment) => void;
    canCollect: boolean;
    contact: string;
    onContactChange: (value: string) => void;
    contactPlaceholder: string;
    address: string;
    onAddressChange: (value: string) => void;
    disabled: boolean;
    children?: ReactNode;
}) {
    const selected = fulfilment === "collection";
    const [fulfilmentExpanded, setFulfilmentExpanded] = useState(true);
    const [expanded, setExpanded] = useState(true);

    return (
        <>
            <View style={styles.section}>
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={
                        fulfilmentExpanded
                            ? "Collapse fulfilment options"
                            : "Expand fulfilment options"
                    }
                    accessibilityState={{ expanded: fulfilmentExpanded }}
                    onPress={() =>
                        setFulfilmentExpanded((value) => !value)
                    }
                    style={styles.sectionToggle}
                >
                    <View style={styles.sectionToggleTitleRow}>
                        <Text style={ui.heading}>Fulfilment</Text>
                        <Ionicons
                            name={
                                fulfilmentExpanded
                                    ? "chevron-up"
                                    : "chevron-down"
                            }
                            size={22}
                            color={palette.brand}
                            accessible={false}
                        />
                    </View>
                    <Text style={ui.small}>
                        Choose how you will receive your order.
                    </Text>
                </Pressable>
                {fulfilmentExpanded ? (
                    <Pressable
                        accessibilityRole="radio"
                        accessibilityLabel="Collection"
                        accessibilityState={{
                            checked: selected,
                            disabled: disabled || !canCollect,
                        }}
                        disabled={disabled || !canCollect}
                        onPress={() => onSelectFulfilment("collection")}
                        style={[
                            styles.fulfilmentOption,
                            selected && styles.fulfilmentOptionSelected,
                            !canCollect && styles.fulfilmentOptionDisabled,
                        ]}
                    >
                        <View style={styles.fulfilmentIcon}>
                            <Ionicons
                                name="storefront-outline"
                                size={20}
                                color={palette.brand}
                                accessible={false}
                            />
                        </View>
                        <View style={styles.fulfilmentCopy}>
                            <Text style={styles.fulfilmentTitle}>
                                Collection
                            </Text>
                            <Text style={ui.small}>
                                Pay the seller when you collect your order
                            </Text>
                        </View>
                        <View
                            style={[
                                styles.radioOuter,
                                selected && styles.radioOuterSelected,
                            ]}
                        >
                            {selected && <View style={styles.radioInner} />}
                        </View>
                    </Pressable>
                ) : null}
            </View>

            <View style={styles.section}>
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={
                        expanded
                            ? "Collapse contact details"
                            : "Expand contact details"
                    }
                    accessibilityState={{ expanded }}
                    onPress={() => setExpanded((value) => !value)}
                    style={styles.sectionToggle}
                >
                    <View style={styles.sectionToggleTitleRow}>
                        <Text style={ui.heading}>Contact details</Text>
                        <Ionicons
                            name={expanded ? "chevron-up" : "chevron-down"}
                            size={22}
                            color={palette.brand}
                            accessible={false}
                        />
                    </View>
                    <Text style={ui.small}>
                        The seller will use these details to coordinate your
                        order.
                    </Text>
                </Pressable>
                {expanded ? (
                    <>
                        <Field
                            label="Email or phone"
                            value={contact}
                            onChangeText={onContactChange}
                            placeholder={contactPlaceholder}
                            editable={!disabled}
                            autoCapitalize="none"
                        />
                        <Field
                            label="Collection notes (optional)"
                            value={address}
                            onChangeText={onAddressChange}
                            placeholder="Add any useful collection details"
                            multiline
                            editable={!disabled}
                        />
                        {children}
                    </>
                ) : null}
            </View>
        </>
    );
}
