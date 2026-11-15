import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";
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
}) {
    const selected = fulfilment === "collection";

    return (
        <>
            <View style={styles.section}>
                <View style={styles.sectionHeading}>
                    <Text style={ui.heading}>Fulfilment</Text>
                    <Text style={ui.small}>
                        Choose how you will receive your order.
                    </Text>
                </View>
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
                        <Text style={styles.fulfilmentTitle}>Collection</Text>
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
            </View>

            <View style={styles.section}>
                <View style={styles.sectionHeading}>
                    <Text style={ui.heading}>Contact details</Text>
                    <Text style={ui.small}>
                        The seller will use these details to coordinate your
                        order.
                    </Text>
                </View>
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
            </View>
        </>
    );
}
