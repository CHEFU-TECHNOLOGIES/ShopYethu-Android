import { useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { DebouncedPressable as Pressable } from "@/components/ui/DebouncedPressable";
import type { Order, OrderStatus } from "@/types/marketplace";
import { money, palette, statusLabel, ui } from "@/constants/market-theme";
import {
    orderReceiptUrl,
    saveOrderQrImage,
} from "@/lib/order-sharing";
import { toast } from "@/lib/toast";
import { Button } from "./Primitives";
import { OrderStatusBadge } from "./OrderStatusBadge";
import { useOrderCard } from "@/hooks/use-order-card";

export function OrderCard({
    order,
    selling = false,
    busy = false,
    loadingAction,
    update,
    confirmPayment,
}: {
    order: Order;
    selling?: boolean;
    busy?: boolean;
    loadingAction?: "status" | "cancel" | "payment" | "collect" | "qr";
    update?: (status: OrderStatus) => void;
    confirmPayment?: () => void;
}) {
    const qrRef = useRef<{
        toDataURL: (
            callback: (base64: string) => void,
            options?: { width: number; height: number },
        ) => void;
    } | null>(null);
    const [savingQr, setSavingQr] = useState(false);
    const qrToken = order.qrToken || order.reference;
    const qrUrl = orderReceiptUrl(order.id, qrToken);
    const {
        next,
        nextAction,
        canReturnToPreparing,
        canCancel,
        historyExpanded,
        setHistoryExpanded,
    } = useOrderCard(order, selling);

    async function saveQr() {
        if (savingQr) return;
        const qr = qrRef.current;
        if (!qr) {
            toast.error("The order QR code is not ready to save.");
            return;
        }

        setSavingQr(true);
        try {
            const image = await new Promise<string>((resolve) =>
                qr.toDataURL(resolve, { width: 512, height: 512 }),
            );
            const saved = await saveOrderQrImage(image, order.reference);
            if (saved) toast.success("QR image saved to Downloads.");
        } catch (cause) {
            const message =
                cause instanceof Error
                    ? cause.message
                    : "Unable to save the order QR image.";
            toast.error(message);
        } finally {
            setSavingQr(false);
        }
    }

    return (
        <View style={styles.receipt}>
            <View style={styles.tearEdge} pointerEvents="none">
                {Array.from({ length: 22 }, (_, index) => (
                    <View key={index} style={styles.tearTooth} />
                ))}
            </View>
            <View style={styles.headerRow}>
                <View style={styles.header}>
                    {/**TODO Uncomment on a big version release */}
                    {/* <Text style={styles.brand}>SHOPYETHU</Text> */}
                    <Text style={styles.receiptTitle}>ORDER RECEIPT</Text>
                    <Text style={styles.receiptNumber}>{order.reference}</Text>
                    <Text style={styles.date}>
                        {new Date(order.createdAt).toLocaleString("en-ZA")}
                    </Text>
                </View>
                <Pressable
                    style={styles.qrContainer}
                    accessibilityRole="button"
                    accessibilityLabel={`QR code for order ${order.reference}`}
                    accessibilityHint="Press and hold to save the QR image to Downloads."
                    accessibilityState={{ disabled: savingQr }}
                    disabled={savingQr}
                    delayLongPress={550}
                    onLongPress={saveQr}
                >
                    <QRCode
                        getRef={(node) => {
                            qrRef.current = node;
                        }}
                        value={qrUrl}
                        size={76}
                        color={palette.ink}
                        backgroundColor="#FFFEFA"
                    />
                    <Text style={styles.qrHint}>
                        {savingQr ? "Saving..." : "Hold to save"}
                    </Text>
                </Pressable>
            </View>
            <View style={styles.dashedDivider} />
            <View style={styles.statusRow}>
                <Text style={styles.sectionLabel}>ORDER STATUS</Text>
                <View style={styles.statusActions}>
                    <OrderStatusBadge status={order.status} />
                </View>
            </View>
            {selling && loadingAction && (
                <Text accessibilityLiveRegion="polite" style={ui.small}>
                    {loadingAction === "payment"
                        ? "Payment confirmation is pending. It is not confirmed yet."
                        : loadingAction === "qr"
                          ? "QR code replacement is pending confirmation."
                          : "Order update is pending confirmation."}
                </Text>
            )}
            {order.fulfilment === "collection" &&
                !["cancelled", "collected", "completed"].includes(
                    order.status,
                ) && (
                    <View style={styles.collectionCode}>
                        <Text style={styles.sectionLabel}>COLLECTION CODE</Text>
                        <Text style={styles.collectionReference}>
                            {order.reference}
                        </Text>
                        <Text style={styles.collectionHint}>
                            {selling
                                ? "Match this code with the customer at collection."
                                : "Show this code to your seller when collecting. Wait until your order is ready."}
                        </Text>
                    </View>
                )}
            <View style={styles.dashedDivider} />
            <View style={styles.itemsHeader}>
                <Text style={styles.sectionLabel}>ITEM</Text>
                <Text style={styles.sectionLabel}>AMOUNT</Text>
            </View>
            {order.items.map((item) => (
                <View key={item.productId} style={styles.itemRow}>
                    <Text style={[ui.body, styles.itemName]}>
                        {item.quantity} × {item.name}
                    </Text>
                    <Text style={styles.itemAmount}>
                        {money(item.priceCents * item.quantity)}
                    </Text>
                </View>
            ))}
            <View style={styles.dashedDivider} />
            <View style={styles.amountRow}>
                <Text style={ui.small}>Items subtotal</Text>
                <Text style={styles.amountValue}>
                    {money(order.subtotalCents)}
                </Text>
            </View>
            <View style={styles.amountRow}>
                <Text style={ui.small}>
                    {order.fulfilment === "collection"
                        ? "Collection fee"
                        : "Delivery"}
                </Text>
                <Text style={styles.amountValue}>
                    {order.deliveryCents ? money(order.deliveryCents) : "Free"}
                </Text>
            </View>
            <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>TOTAL</Text>
                <Text style={styles.totalAmount}>
                    {money(order.totalCents)}
                </Text>
            </View>
            <View style={styles.dashedDivider} />
            <Text style={styles.sectionLabel}>FULFILMENT</Text>
            <Text style={ui.body}>
                {order.fulfilment === "collection"
                    ? "Collection from the seller"
                    : "Local delivery"}
            </Text>
            {order.address ? (
                <Text style={ui.small}>{order.address}</Text>
            ) : null}
            <View style={styles.amountRow}>
                <Text style={styles.sectionLabel}>PAYMENT</Text>
                <Text style={styles.paymentValue}>
                    {order.paymentStatus === "paid-on-collection"
                        ? "Confirmed by seller"
                        : "Due at collection"}
                </Text>
            </View>
            {order.paymentNote ? (
                <Text style={ui.small}>{order.paymentNote}</Text>
            ) : null}
            {order.paymentReceivedAt && (
                <Text style={ui.small}>
                    Payment confirmed{" "}
                    {new Date(order.paymentReceivedAt).toLocaleString("en-ZA")}
                </Text>
            )}
            {selling && (
                <View style={styles.contact}>
                    <Text style={styles.sectionLabel}>CUSTOMER</Text>
                    <Text style={ui.body}>{order.contact}</Text>
                </View>
            )}
            <View style={styles.dashedDivider} />
            <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${historyExpanded ? "Collapse" : "Expand"} order updates`}
                accessibilityState={{ expanded: historyExpanded }}
                onPress={() => setHistoryExpanded((expanded) => !expanded)}
                style={styles.historyToggle}
            >
                <Text style={styles.historyTitle}>
                    Order updates ({order.history.length})
                </Text>
                <Text style={styles.historyAction}>
                    {historyExpanded ? "Hide" : "Show"}
                </Text>
            </Pressable>
            {historyExpanded &&
                order.history.map((event, index) => (
                    <View
                        key={`${event.at}-${index}`}
                        style={styles.historyRow}
                    >
                        <Text style={ui.small}>
                            {statusLabel(event.status)}
                        </Text>
                        <Text style={styles.historyDate}>
                            {new Date(event.at).toLocaleString("en-ZA")}
                        </Text>
                    </View>
                ))}
            {selling && (
                <View style={{ gap: 10, marginTop: 4 }}>
                    {next && (
                        <Button
                            title={
                                nextAction[order.status] ||
                                `Mark ${statusLabel(next)}`
                            }
                            disabled={busy}
                            compact
                            loading={loadingAction === "status"}
                            onPress={() => update?.(next)}
                        />
                    )}
                    {canReturnToPreparing && (
                        <Button
                            title="Back to preparing"
                            tone="secondary"
                            disabled={busy}
                            compact
                            loading={loadingAction === "status"}
                            onPress={() => update?.("preparing")}
                        />
                    )}
                    {order.status === "ready" &&
                        order.paymentStatus !== "paid-on-collection" && (
                            <Button
                                title="Confirm payment received"
                                disabled={busy}
                                compact
                                loading={loadingAction === "payment"}
                                onPress={() => confirmPayment?.()}
                            />
                        )}
                    {order.status === "ready" &&
                        order.paymentStatus === "paid-on-collection" && (
                            <Button
                                title="Mark as collected"
                                disabled={busy}
                                compact
                                loading={loadingAction === "collect"}
                                onPress={() => update?.("collected")}
                            />
                        )}
                    {canCancel && (
                        <View style={{ flexDirection: "row", gap: 8 }}>
                            <Button
                                title="Cancel order"
                                tone="danger"
                                compact
                                inline
                                disabled={busy}
                                loading={loadingAction === "cancel"}
                                onPress={() => update?.("cancelled")}
                            />
                        </View>
                    )}
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    tearEdge: {
        alignItems: "flex-start",
        flexDirection: "row",
        height: 8,
        justifyContent: "space-between",
        paddingHorizontal: 6,
        position: "absolute",
        left: 0,
        right: 0,
        top: 0,
    },
    tearTooth: {
        borderTopColor: palette.canvas,
        borderTopWidth: 8,
        borderLeftColor: "transparent",
        borderLeftWidth: 6,
        borderRightColor: "transparent",
        borderRightWidth: 6,
        height: 8,
        width: 12,
    },
    receipt: {
        backgroundColor: "#FFFEFA",
        borderBottomColor: palette.line,
        borderBottomLeftRadius: 8,
        borderBottomRightRadius: 8,
        borderBottomWidth: 1,
        borderLeftColor: palette.line,
        borderLeftWidth: 1,
        borderRightColor: palette.line,
        borderRightWidth: 1,
        padding: 18,
        paddingTop: 26,
        gap: 12,
    },
    headerRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
    },
    header: { alignItems: "flex-start", flex: 1, gap: 4 },
    qrContainer: {
        alignItems: "center",
        backgroundColor: "#FFFEFA",
        borderColor: palette.line,
        borderRadius: 4,
        borderWidth: 1,
        justifyContent: "center",
        padding: 4,
    },
    qrHint: {
        color: palette.muted,
        fontSize: 8,
        fontWeight: "600",
        marginTop: 2,
    },
    brand: {
        color: palette.brand,
        fontSize: 11,
        fontWeight: "800",
        letterSpacing: 2,
    },
    receiptTitle: {
        color: palette.ink,
        fontSize: 17,
        fontWeight: "700",
        letterSpacing: 1,
    },
    receiptNumber: {
        color: palette.ink,
        fontFamily: "monospace",
        fontSize: 18,
        fontWeight: "700",
        letterSpacing: 1,
        marginTop: 4,
    },
    date: { color: palette.muted, fontSize: 12, textAlign: "center" },
    dashedDivider: {
        borderBottomColor: palette.line,
        borderBottomWidth: 1,
        borderStyle: "dashed",
        marginVertical: 2,
    },
    statusRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    statusActions: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    sectionLabel: {
        color: palette.muted,
        fontSize: 10,
        fontWeight: "700",
        letterSpacing: 1,
    },
    collectionCode: {
        alignItems: "center",
        backgroundColor: palette.soft,
        borderRadius: 6,
        gap: 5,
        padding: 12,
    },
    collectionReference: {
        color: palette.ink,
        fontFamily: "monospace",
        fontSize: 20,
        fontWeight: "700",
        letterSpacing: 2,
    },
    collectionHint: {
        color: palette.muted,
        fontSize: 12,
        lineHeight: 18,
        textAlign: "center",
    },
    itemsHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingBottom: 2,
    },
    itemRow: {
        flexDirection: "row",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: 12,
    },
    itemName: { flex: 1 },
    itemAmount: {
        color: palette.ink,
        fontSize: 14,
        fontWeight: "600",
        textAlign: "right",
    },
    amountRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
    },
    amountValue: { color: palette.ink, fontSize: 13, fontWeight: "600" },
    totalRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        borderTopColor: palette.ink,
        borderTopWidth: 1,
        paddingTop: 10,
    },
    totalLabel: {
        color: palette.ink,
        fontSize: 13,
        fontWeight: "800",
        letterSpacing: 1,
    },
    totalAmount: { color: palette.ink, fontSize: 20, fontWeight: "800" },
    paymentValue: {
        color: palette.brand,
        fontSize: 12,
        fontWeight: "700",
        textAlign: "right",
    },
    contact: { gap: 4 },
    historyToggle: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    historyTitle: { color: palette.ink, fontSize: 14, fontWeight: "700" },
    historyAction: {
        color: palette.brand,
        fontSize: 11,
        fontWeight: "700",
        letterSpacing: 1,
        textTransform: "uppercase",
    },
    historyRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 12,
    },
    historyDate: {
        color: palette.muted,
        flexShrink: 1,
        fontSize: 11,
        textAlign: "right",
    },
});
