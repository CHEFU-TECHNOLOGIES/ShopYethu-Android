import { Text, View } from "react-native";
import { palette, statusLabel, ui } from "@/constants/market-theme";
import type { OrderStatus } from "@/types/marketplace";

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
    return (
        <View
            style={{
                borderRadius: 20,
                paddingVertical: 5,
                paddingHorizontal: 9,
                backgroundColor: palette.soft,
            }}
        >
            <Text style={ui.badge}>{statusLabel(status)}</Text>
        </View>
    );
}
