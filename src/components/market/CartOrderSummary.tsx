import { money, ui } from "@/constants/market-theme";
import { Text, View } from "react-native";
import { styles } from "./cart-styles";

export function CartOrderSummary({
    subtotal,
    collectionFee,
}: {
    subtotal: number;
    collectionFee: number;
}) {
    return (
        <View style={styles.summaryCard}>
            <Text style={ui.heading}>Order summary</Text>
            <View style={styles.summaryLine}>
                <Text style={ui.body}>Items subtotal</Text>
                <Text style={ui.body}>{money(subtotal)}</Text>
            </View>
            <View style={styles.summaryLine}>
                <Text style={ui.body}>Collection</Text>
                <Text style={ui.body}>
                    {collectionFee ? money(collectionFee) : "Free"}
                </Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryTotal}>
                <Text style={styles.totalLabel}>Estimated total</Text>
                <Text style={styles.totalAmount}>
                    {money(subtotal + collectionFee)}
                </Text>
            </View>
           
        </View>
    );
}
