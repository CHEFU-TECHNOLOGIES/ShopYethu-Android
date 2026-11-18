import assert from "node:assert/strict";
import { test } from "node:test";
import * as jsx from "react/jsx-runtime";
import { loadTs } from "./load-ts.mjs";

function nodes(node) {
    if (!node || typeof node !== "object") return [];
    if (Array.isArray(node)) return node.flatMap(nodes);
    return [node, ...nodes(node.props?.children)];
}

test("seller order search matches order references, products, and customer contacts, and clears", () => {
    const orders = [
        {
            id: "order-1",
            reference: "SY-101",
            contact: "0825550101",
            items: [{ name: "Coffee beans", productId: "coffee", quantity: 1 }],
        },
        {
            id: "order-2",
            reference: "SY-202",
            contact: "buyer@example.test",
            items: [{ name: "Green tea", productId: "tea", quantity: 2 }],
        },
    ];
    const state = [];
    let cursor = 0;
    const { default: SellerOrders } = loadTs("src/app/selling/orders.tsx", {
        react: {
            useState(initial) {
                const index = cursor++;
                if (!(index in state)) state[index] = initial;
                return [
                    state[index],
                    value => {
                        state[index] =
                            typeof value === "function"
                                ? value(state[index])
                                : value;
                    },
                ];
            },
        },
        "react/jsx-runtime": jsx,
        "react-native": { Text: "Text", View: "View" },
        "expo-router": { router: {} },
        "@/components/market/ListPage": { ListPage: "ListPage" },
        "@/components/market/Primitives": {
            ResourceState: "ResourceState",
            SignInNotice: "SignInNotice",
        },
        "@/components/market/OrderListRow": { OrderListRow: "OrderListRow" },
        "@/components/market/OrdersSkeleton": { OrdersSkeleton: "OrdersSkeleton" },
        "@/components/market/ClearableTextInput": {
            ClearableTextInput: "ClearableTextInput",
        },
        "@/lib/auth": {
            useAuth: () => ({ session: { user: { uid: "seller" } } }),
        },
        "@/hooks/use-resource": {
            useResource: () => ({
                data: { orders },
                refresh() {},
                refreshing: false,
            }),
        },
        "@/constants/market-theme": {
            palette: { muted: "muted" },
            ui: { subtitle: "subtitle" },
        },
    });
    const render = () => {
        cursor = 0;
        return SellerOrders();
    };

    let page = render();
    const search = nodes(page.props.header).find(
        node => node.type === "ClearableTextInput",
    );
    assert.ok(search);
    assert.equal(page.props.data.length, 2);

    search.props.onChangeText("green tea");
    page = render();
    assert.deepEqual(page.props.data.map(order => order.id), ["order-2"]);

    search.props.onChangeText("0825550101");
    page = render();
    assert.deepEqual(page.props.data.map(order => order.id), ["order-1"]);

    search.props.onChangeText("missing order");
    page = render();
    assert.equal(page.props.data.length, 0);
    assert.ok(page.props.ListEmptyComponent);

    search.props.onChangeText("");
    page = render();
    assert.equal(page.props.data.length, 2);
});
