import { Text, View } from "react-native";
import type { CartLine } from "@/lib/cart";
import { ui } from "@/constants/market-theme";
import { CartLineItem } from "./CartLineItem";
import { styles } from "./cart-styles";

export function CartItemsSection({
    items,
    disabled,
    onChangeQuantity,
}: {
    items: CartLine[];
    disabled: boolean;
    onChangeQuantity: (id: string, quantity: number) => void;
}) {
    const totalQuantity = items.reduce(
        (total, item) => total + item.quantity,
        0,
    );

    return (
        <View style={styles.section}>
            <View style={styles.sectionHeader}>
                <Text style={ui.heading}>Items in your basket</Text>
                <Text style={ui.small}>
                    {totalQuantity}{" "}
                    {totalQuantity === 1 ? "item" : "items"}
                </Text>
            </View>
            {items.map(({ product, quantity }) => (
                <CartLineItem
                    key={product.id}
                    product={product}
                    quantity={quantity}
                    disabled={disabled}
                    onChangeQuantity={(nextQuantity) =>
                        onChangeQuantity(product.id, nextQuantity)
                    }
                />
            ))}
        </View>
    );
}
