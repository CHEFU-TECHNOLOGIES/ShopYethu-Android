import assert from "node:assert/strict";
import { test } from "node:test";
import { loadTs } from "./load-ts.mjs";

test("QR image saving writes a full-resolution PNG to the selected Android folder", async () => {
    const calls = [];
    const { saveOrderQrImage } = loadTs("src/lib/order-sharing.ts", {
        "react-native": {
            Platform: { OS: "android" },
            Share: { share: async () => {} },
        },
        "expo-file-system/legacy": {
            EncodingType: { Base64: "base64" },
            StorageAccessFramework: {
                getUriForDirectoryInRoot(folder) {
                    calls.push(["root", folder]);
                    return "saf://Download";
                },
                async requestDirectoryPermissionsAsync(uri) {
                    calls.push(["permission", uri]);
                    return { granted: true, directoryUri: "saf://selected" };
                },
                async createFileAsync(directory, name, mimeType) {
                    calls.push(["create", directory, name, mimeType]);
                    return "saf://selected/receipt.png";
                },
                async writeAsStringAsync(uri, contents, options) {
                    calls.push(["write", uri, contents, options]);
                },
            },
        },
    });

    assert.equal(await saveOrderQrImage("base64-png", "SY/ORDER #1"), true);
    assert.deepEqual(JSON.parse(JSON.stringify(calls)), [
        ["root", "Download"],
        ["permission", "saf://Download"],
        ["create", "saf://selected", "ShopYethu-QR-SY-ORDER--1", "image/png"],
        [
            "write",
            "saf://selected/receipt.png",
            "base64-png",
            { encoding: "base64" },
        ],
    ]);
});

test("sharing a QR code shares its revocable order URL", async () => {
    let shared;
    const { shareOrderQr } = loadTs("src/lib/order-sharing.ts", {
        "react-native": {
            Platform: { OS: "android" },
            Share: { share: async options => (shared = options) },
        },
        "expo-file-system/legacy": {},
    });

    await shareOrderQr("order id", "current-token", "SY-123");

    assert.equal(shared.title, "ShopYethu order SY-123");
    assert.match(
        shared.message,
        /https:\/\/api\.chefu\.co\.za\/shopyethu\/order\/order%20id\/current-token/,
    );
});
