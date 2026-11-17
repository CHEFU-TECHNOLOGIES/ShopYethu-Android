import assert from "node:assert/strict";
import { test } from "node:test";
import { loadTs } from "./load-ts.mjs";

const product = { id: "product/one", name: "Woven basket", priceCents: 12500 };
const store = { id: "seller/one", name: "Mama's Pantry" };

test("product share message includes product details and a direct product link", async () => {
    const shared = [];
    const { productShareMessage, productShareUrl, shareProduct } = loadTs(
        "src/lib/product-sharing.ts",
        {
            "react-native": {
                Share: {
                    share: async (content) => {
                        shared.push(content);
                        return {};
                    },
                },
            },
            "@/constants/market-theme": {
                money: (cents) => `R${(cents / 100).toFixed(2)}`,
            },
        },
    );

    const message = productShareMessage(product, store);
    assert.match(message, /Woven basket/);
    assert.match(message, /Mama's Pantry/);
    assert.match(message, /R125\.00/);
    assert.match(message, /shopyethu\/product\/product%2Fone/);
    assert.equal(
        productShareUrl(product.id),
        "https://api.chefu.co.za/shopyethu/product/product%2Fone",
    );

    await shareProduct(product, store);
    assert.equal(shared.length, 1);
    assert.equal(shared[0].title, "Discover Woven basket on ShopYethu");
    assert.equal(shared[0].message, message);
});
