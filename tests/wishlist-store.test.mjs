import assert from "node:assert/strict";
import { test } from "node:test";
import { loadTs } from "./load-ts.mjs";

const { createWishlistStore } = loadTs("src/lib/wishlist-store.ts");

function setup() {
    const values = new Map();
    let failWrites = false;
    const store = createWishlistStore({
        read: async (key) => values.get(key) ?? null,
        write: async (key, value) => {
            if (failWrites) throw new Error("Storage unavailable");
            values.set(key, structuredClone(value));
        },
    });
    return {
        store,
        values,
        failWrites(value) {
            failWrites = value;
        },
    };
}

test("wishlist data persists separately for guest and each account", async () => {
    const { store, values } = setup();
    await store.activate(null);
    assert.equal(await store.toggle("product-guest"), true);

    await store.activate("user-one");
    assert.deepEqual([...store.get().productIds], []);
    assert.equal(await store.toggle("product-one"), true);
    assert.equal(await store.toggle("product-one"), false);
    assert.deepEqual(values.get("shopyethu.wishlist.v1.account.user-one"), []);

    await store.activate("user-two");
    assert.deepEqual([...store.get().productIds], []);
    await store.activate(null);
    assert.deepEqual([...store.get().productIds], ["product-guest"]);
});

test("failed writes preserve the saved wishlist and allow retry", async () => {
    const { store, failWrites } = setup();
    await store.activate("user");
    failWrites(true);
    await assert.rejects(store.toggle("product"), /Could not save your wishlist/);
    assert.deepEqual([...store.get().productIds], []);
    assert.match(store.get().error, /Could not save/);

    failWrites(false);
    assert.equal(await store.toggle("product"), true);
    assert.deepEqual([...store.get().productIds], ["product"]);
    assert.equal(store.get().error, "");
});

test("corrupt wishlist storage is reported instead of partially restored", async () => {
    const { store, values } = setup();
    values.set("shopyethu.wishlist.v1.account.user", ["valid-product", 4]);
    await store.activate("user");
    assert.equal(store.get().ready, false);
    assert.deepEqual([...store.get().productIds], []);
    assert.match(store.get().error, /Could not load your wishlist/);
});
