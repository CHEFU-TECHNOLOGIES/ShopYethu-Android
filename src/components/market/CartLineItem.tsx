import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";
import { DebouncedPressable as Pressable } from "@/components/ui/DebouncedPressable";
import { MarketImage } from "@/components/market/MarketImage";
import { money, palette, ui } from "@/constants/market-theme";
import type { Product } from "@/types/marketplace";
import { styles } from "./cart-styles";

export function CartLineItem({
    product,
    quantity,
    disabled,
    onChangeQuantity,
}: {
    product: Product;
    quantity: number;
    disabled: boolean;
    onChangeQuantity: (quantity: number) => void;
}) {
    const maxQuantity = Math.min(product.stock, 99);
    const canIncrease = !disabled && quantity < maxQuantity;

    return (
        <View style={styles.itemCard}>
            {product.photos[0] ? (
                <MarketImage
                    accessibilityLabel={`${product.name} photo`}
                    uri={product.photos[0]}
                    width={160}
                    style={styles.itemImage}
                />
            ) : (
                <View style={styles.itemImagePlaceholder}>
                    <Ionicons
                        name="image-outline"
                        size={24}
                        color={palette.muted}
                        accessible={false}
                    />
                </View>
            )}
            <View style={styles.itemDetails}>
                <Text style={styles.itemName} numberOfLines={2}>
                    {product.name}
                </Text>
                <Text style={ui.small}>
                    {money(product.priceCents)} each
                </Text>
                <View style={styles.itemFooter}>
                    <View style={styles.quantityControl}>
                        <Pressable
                            accessibilityRole="button"
                            accessibilityLabel={`Remove one ${product.name} from basket`}
                            accessibilityState={{
                                disabled: disabled || quantity <= 0,
                            }}
                            disabled={disabled || quantity <= 0}
                            hitSlop={4}
                            onPress={() => onChangeQuantity(quantity - 1)}
                            style={({ pressed }) => [
                                styles.quantityButton,
                                (disabled || quantity <= 0) &&
                                    styles.quantityButtonDisabled,
                                pressed &&
                                    !disabled &&
                                    quantity > 0 &&
                                    styles.quantityButtonPressed,
                            ]}
                        >
                            <Ionicons
                                name="remove"
                                size={18}
                                color={
                                    disabled || quantity <= 0
                                        ? palette.muted
                                        : palette.brand
                                }
                                accessible={false}
                            />
                        </Pressable>
                        <Text
                            accessibilityLabel={`${quantity} ${
                                quantity === 1 ? "item" : "items"
                            }`}
                            accessibilityLiveRegion="polite"
                            style={styles.quantityValue}
                        >
                            {quantity}
                        </Text>
                        <Pressable
                            accessibilityRole="button"
                            accessibilityLabel={`Add one ${product.name} to basket`}
                            accessibilityState={{ disabled: !canIncrease }}
                            disabled={!canIncrease}
                            hitSlop={4}
                            onPress={() => onChangeQuantity(quantity + 1)}
                            style={({ pressed }) => [
                                styles.quantityButton,
                                !canIncrease &&
                                    styles.quantityButtonDisabled,
                                pressed &&
                                    canIncrease &&
                                    styles.quantityButtonPressed,
                            ]}
                        >
                            <Ionicons
                                name="add"
                                size={18}
                                color={
                                    canIncrease ? palette.brand : palette.muted
                                }
                                accessible={false}
                            />
                        </Pressable>
                    </View>
                    <Text style={styles.itemTotal}>
                        {money(product.priceCents * quantity)}
                    </Text>
                </View>
            </View>
        </View>
    );
}
