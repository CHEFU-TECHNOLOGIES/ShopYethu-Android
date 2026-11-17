import { Text, View } from "react-native";
import { money, ui } from "@/constants/market-theme";
import type { CartLine } from "@/lib/cart";
import { Button } from "./Button";

export function CartAlternativeBaskets({
    baskets,
    disabled,
    onSwitch,
}: {
    baskets: CartLine[][];
    disabled: boolean;
    onSwitch: (index: number) => void;
}) {
    if (!baskets.length) return null;

    return (
        <View style={{ gap: 12 }}>
            {baskets.map((items, index) => {
                const subtotal = items.reduce(
                    (total, item) =>
                        total + item.product.priceCents * item.quantity,
                    0,
                );
                const storeId = items[0]?.product.storeId;

                return (
                    <View key={`${storeId || "basket"}-${index}`} style={ui.card}>
                        <Text style={ui.heading}>Another saved basket</Text>
                        <Text style={ui.subtitle}>
                            {items.reduce((count, item) => count + item.quantity, 0)}{" "}
                            items · {money(subtotal)}
                        </Text>
                        <Text style={ui.small}>
                            Switching swaps it with your current basket. Both
                            baskets stay saved.
                        </Text>
                        <Button
                            title="Switch to this basket"
                            secondary
                            disabled={disabled}
                            onPress={() => onSwitch(index)}
                        />
                    </View>
                );
            })}
        </View>
    );
}
