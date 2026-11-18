import assert from "node:assert/strict";
import { test } from "node:test";
import * as jsx from "react/jsx-runtime";
import { loadTs } from "./load-ts.mjs";

const order = {
    id: "order-1",
    reference: "SY-ORDER-1",
    buyerUid: "buyer",
    sellerUid: "seller",
    storeId: "store",
    items: [],
    subtotalCents: 0,
    deliveryCents: 0,
    totalCents: 0,
    fulfilment: "collection",
    address: "",
    contact: "buyer@example.test",
    status: "ready",
    paymentStatus: "not-collected",
    paymentNote: "",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    history: [],
};

test("only unpaid seller orders in ready status can return to preparing", () => {
    const { useOrderCard } = loadTs("src/hooks/use-order-card.ts", {
        react: { useState: initial => [initial, () => {}] },
        "expo-router": { router: { navigate() {} } },
    });

    assert.equal(useOrderCard(order, true).canReturnToPreparing, true);
    assert.equal(
        useOrderCard({ ...order, paymentStatus: "paid-on-collection" }, true)
            .canReturnToPreparing,
        false,
    );
    assert.equal(
        useOrderCard({ ...order, status: "preparing" }, true)
            .canReturnToPreparing,
        false,
    );
    assert.equal(useOrderCard(order, false).canReturnToPreparing, false);
});

test("the receipt button requests a return to preparing", () => {
    let updatedStatus;
    const { OrderCard } = loadTs("src/components/market/OrderCard.tsx", {
        "react/jsx-runtime": jsx,
        "react-native": {
            StyleSheet: { create: styles => styles },
            Text: "Text",
            View: "View",
        },
        "react-native-qrcode-svg": "QRCode",
        "@/components/ui/DebouncedPressable": { DebouncedPressable: "Pressable" },
        "@/constants/market-theme": {
            money: value => String(value),
            palette: {
                brand: "",
                canvas: "",
                ink: "",
                line: "",
                muted: "",
                soft: "",
            },
            statusLabel: value => value,
            ui: { badge: {}, body: {}, small: {} },
        },
        "./Primitives": { Button: "Button" },
        "./ReportLink": { ReportLink: "ReportLink" },
        "./OrderStatusBadge": { OrderStatusBadge: "OrderStatusBadge" },
        "@/hooks/use-order-card": {
            useOrderCard: () => ({
                next: null,
                nextAction: {},
                canReturnToPreparing: true,
                canCancel: false,
                historyExpanded: false,
                setHistoryExpanded() {},
                reportOrder() {},
            }),
        },
    });

    const tree = OrderCard({
        order,
        selling: true,
        update: status => {
            updatedStatus = status;
        },
    });
    const button = nodes(tree).find(
        node => node.type === "Button" && node.props.title === "Back to preparing",
    );

    assert.ok(button);
    button.props.onPress();
    assert.equal(updatedStatus, "preparing");
    const qrCode = nodes(tree).find(node => node.type === "QRCode");
    assert.equal(qrCode.props.value, order.reference);
});

test("seller status changes optimistically add history and roll back on failure", async () => {
    const cells = [];
    let cursor = 0;
    let rejectRequest;
    let data = {
        orders: [{
            ...order,
            history: [{ status: "ready", at: "2026-01-01T00:00:00.000Z" }],
        }],
    };
    const { useSellerOrderDetails } = loadTs(
        "src/hooks/use-seller-order-details.ts",
        {
            react: {
                useRef(initial) {
                    return (cells[cursor++] ||= { current: initial });
                },
                useState(initial) {
                    const index = cursor++;
                    if (!(index in cells)) cells[index] = initial;
                    return [
                        cells[index],
                        value => {
                            cells[index] =
                                typeof value === "function"
                                    ? value(cells[index])
                                    : value;
                        },
                    ];
                },
            },
            "@/hooks/use-resource": {
                useResource: () => ({
                    data,
                    mutate(update) {
                        data = update(data);
                    },
                }),
            },
            "@/lib/api": {
                api: () =>
                    new Promise((_, reject) => {
                        rejectRequest = reject;
                    }),
            },
            "@/lib/auth": { useAuth: () => ({ session: { user: { uid: "seller" } } }) },
            "@/lib/toast": { toast: { error() {} } },
        },
    );
    function OrderDetailsHarness() {
        return useSellerOrderDetails(order.id);
    }
    const render = () => {
        cursor = 0;
        return OrderDetailsHarness();
    };

    render().update("preparing");
    assert.equal(data.orders[0].status, "preparing");
    assert.equal(data.orders[0].history.at(-1).status, "preparing");

    rejectRequest(new Error("Order update rejected."));
    await new Promise(setImmediate);
    assert.equal(data.orders[0].status, "ready");
    assert.equal(data.orders[0].history.length, 1);
    assert.equal(render().error, "Order update rejected.");
});

function nodes(node) {
    if (!node || typeof node !== "object") return [];
    if (Array.isArray(node)) return node.flatMap(nodes);
    return [node, ...nodes(node.props?.children)];
}
