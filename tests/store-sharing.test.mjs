import assert from "node:assert/strict";
import { test } from "node:test";
import { loadTs } from "./load-ts.mjs";

const store = { id: "seller/one", name: "Mama's Pantry" };

test("the share message contains the seller name and an encoded HTTPS storefront link", async () => {
    const { storeShareMessage } = loadTs(
        "src/lib/store-sharing.ts",
        {
            "react-native": {
                Share: { share: async () => ({}) },
            },
        },
    );
    const message = storeShareMessage(store);
    assert.match(message, /Mama's Pantry/);
    assert.match(message, /https:\/\/api\.chefu\.co\.za\/shopyethu\/store\/seller%2Fone/);
});

test("opens the native share sheet so the user can choose a sharing app", async () => {
    const shared = [];
    const { shareStore } = loadTs("src/lib/store-sharing.ts", {
        "react-native": {
            Share: { share: async (content) => { shared.push(content); return {}; } },
        },
    });
    await shareStore(store);
    assert.equal(shared.length, 1);
    assert.equal(shared[0].title, "Discover Mama's Pantry on ShopYethu");
    assert.match(shared[0].message, /https:\/\/api\.chefu\.co\.za\/shopyethu\/store\/seller%2Fone/);
});
