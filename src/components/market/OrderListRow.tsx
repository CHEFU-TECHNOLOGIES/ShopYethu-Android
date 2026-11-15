import { Text, View } from "react-native";
import { DebouncedPressable as Pressable } from "@/components/ui/DebouncedPressable";
import { money, statusLabel, ui } from "@/constants/market-theme";
import type { Order } from "@/types/marketplace";
import { OrderStatusBadge } from "./OrderStatusBadge";

export function OrderListRow({
    order,
    onPress,
}: {
    order: Order;
    onPress: () => void;
}) {
    const itemCount = order.items.reduce(
        (total, item) => total + item.quantity,
        0,
    );
    const itemNames = order.items
        .slice(0, 2)
        .map((item) => item.name)
        .join(", ");
    const remainingItems = order.items.length - 2;

    return (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Order ${order.reference}, ${statusLabel(order.status)}, ${money(order.totalCents)}`}
            onPress={onPress}
            style={({ pressed }) => [
                ui.card,
                {
                    padding: 14,
                    gap: 8,
                    borderRadius: 16,
                    opacity: pressed ? 0.78 : 1,
                },
            ]}
        >
            <View style={ui.between}>
                <Text style={[ui.body, { fontWeight: "700" }]}>
                    {order.reference}
                </Text>
                <OrderStatusBadge status={order.status} />
            </View>
            <Text style={ui.small} numberOfLines={1}>
                {itemCount} {itemCount === 1 ? "item" : "items"} · {itemNames}
                {remainingItems > 0 ? ` +${remainingItems} more` : ""}
            </Text>
            <View style={ui.between}>
                <Text style={ui.small}>
                    {new Date(order.createdAt).toLocaleDateString("en-ZA")}
                </Text>
                <Text style={[ui.body, { fontWeight: "700" }]}>
                    {money(order.totalCents)}
                </Text>
            </View>
        </Pressable>
    );
}
