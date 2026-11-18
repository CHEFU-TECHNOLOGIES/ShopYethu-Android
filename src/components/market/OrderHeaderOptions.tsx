import type { Order } from "@/types/marketplace";
import { toast } from "@/lib/toast";
import { shareOrderQr } from "@/lib/order-sharing";
import { useOrderCard } from "@/hooks/use-order-card";
import { OrderMoreOptionsDropdown } from "./OrderMoreOptionsDropdown";

export function OrderHeaderOptions({
    order,
    selling,
    disabled = false,
    onRegenerateQr,
}: {
    order: Order;
    selling: boolean;
    disabled?: boolean;
    onRegenerateQr?: () => void;
}) {
    const { reportOrder } = useOrderCard(order, selling);
    const qrToken = order.qrToken || order.reference;

    function shareQr() {
        void shareOrderQr(order.id, qrToken, order.reference).catch((cause) => {
            const message =
                cause instanceof Error
                    ? cause.message
                    : "Unable to share the order QR code.";
            toast.error(message);
        });
    }

    return (
        <OrderMoreOptionsDropdown
            disabled={disabled}
            onReport={reportOrder}
            onShareQr={selling ? shareQr : undefined}
            onRegenerateQr={selling ? onRegenerateQr : undefined}
        />
    );
}
