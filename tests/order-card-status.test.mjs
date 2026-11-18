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

test("the receipt button requests a return to preparing", async () => {
    let updatedStatus;
    let savedImage;
    let sharedQr;
    const { OrderCard } = loadTs("src/components/market/OrderCard.tsx", {
        react: {
            useRef: initial => ({ current: initial }),
            useState: initial => [initial, () => {}],
        },
        "react/jsx-runtime": jsx,
        "react-native": {
            Pressable: "Pressable",
            StyleSheet: { create: styles => styles },
            Text: "Text",
            View: "View",
        },
        "react-native-qrcode-svg": "QRCode",
        "@/lib/order-sharing": {
            orderReceiptUrl: (id, token) =>
                `https://api.chefu.co.za/shopyethu/order/${encodeURIComponent(id)}/${encodeURIComponent(token)}`,
            saveOrderQrImage: async (image, reference) => {
                savedImage = { image, reference };
                return true;
            },
            shareOrderQr: async (id, token, reference) => {
                sharedQr = { id, token, reference };
            },
        },
        "@/lib/toast": { toast: { success() {}, error() {} } },
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
        "./OrderMoreOptionsDropdown": {
            OrderMoreOptionsDropdown: "OrderMoreOptionsDropdown",
        },
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
    assert.equal(
        qrCode.props.value,
        `https://api.chefu.co.za/shopyethu/order/${encodeURIComponent(order.id)}/${encodeURIComponent(order.reference)}`,
    );
    qrCode.props.getRef({
        toDataURL(callback, options) {
            assert.equal(JSON.stringify(options), JSON.stringify({ width: 512, height: 512 }));
            callback("encoded-png");
        },
    });
    const qrPressable = nodes(tree).find(
        node => node.type === "Pressable" &&
            node.props.accessibilityLabel === `QR code for order ${order.reference}`,
    );
    await qrPressable.props.onLongPress();
    assert.deepEqual(savedImage, {
        image: "encoded-png",
        reference: order.reference,
    });
});

test("order options are attached to the order-details header and seller-only actions stay private", async () => {
    let reported = false;
    let sharedQr;
    let regenerated = false;
    const { OrderHeaderOptions } = loadTs(
        "src/components/market/OrderHeaderOptions.tsx",
        {
            "react/jsx-runtime": jsx,
            "./OrderMoreOptionsDropdown": {
                OrderMoreOptionsDropdown: "OrderMoreOptionsDropdown",
            },
            "@/lib/order-sharing": {
                shareOrderQr: async (id, token, reference) => {
                    sharedQr = { id, token, reference };
                },
            },
            "@/lib/toast": { toast: { success() {}, error() {} } },
            "@/hooks/use-order-card": {
                useOrderCard: () => ({
                    reportOrder() {
                        reported = true;
                    },
                }),
            },
        },
    );
    const tree = OrderHeaderOptions({
        order,
        selling: true,
        disabled: false,
        onRegenerateQr: () => (regenerated = true),
    });
    const menu = nodes(tree).find(
        node => node.type === "OrderMoreOptionsDropdown",
    );
    assert.ok(menu);
    assert.equal(menu.props.disabled, false);
    assert.equal(typeof menu.props.onShareQr, "function");
    menu.props.onShareQr();
    await new Promise(setImmediate);
    assert.deepEqual(sharedQr, {
        id: order.id,
        token: order.reference,
        reference: order.reference,
    });
    assert.equal(typeof menu.props.onRegenerateQr, "function");
    menu.props.onReport();
    assert.equal(reported, true);
    menu.props.onRegenerateQr();
    assert.equal(regenerated, true);

    const buyerTree = OrderHeaderOptions({ order, selling: false });
    const buyerMenu = nodes(buyerTree).find(
        node => node.type === "OrderMoreOptionsDropdown",
    );
    assert.equal(buyerMenu.props.onRegenerateQr, undefined);
    assert.equal(buyerMenu.props.onShareQr, undefined);
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

test("QR regeneration updates the receipt after success and preserves it on failure", async () => {
    const cells = [];
    let cursor = 0;
    let rejectNext = false;
    let request;
    let data = { orders: [order] };
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
                api: async (path, options) => {
                    request = { path, options };
                    if (rejectNext) throw new Error("QR rotation failed.");
                    return { ...data.orders[0], qrToken: "replacement-token" };
                },
            },
            "@/lib/auth": { useAuth: () => ({ session: { user: { uid: "seller" } } }) },
            "@/lib/toast": { toast: { success() {}, error() {} } },
        },
    );
    function OrderDetailsHarness() {
        return useSellerOrderDetails(order.id);
    }
    const render = () => {
        cursor = 0;
        return OrderDetailsHarness();
    };

    await render().regenerateQr();
    assert.equal(request.path, `/seller/orders/${order.id}/qr`);
    assert.equal(request.options.method, "POST");
    assert.equal(data.orders[0].qrToken, "replacement-token");

    rejectNext = true;
    await render().regenerateQr();
    assert.equal(data.orders[0].qrToken, "replacement-token");
    assert.equal(render().error, "QR rotation failed.");
});

function nodes(node) {
    if (!node || typeof node !== "object") return [];
    if (Array.isArray(node)) return node.flatMap(nodes);
    return [node, ...nodes(node.props?.children)];
}
