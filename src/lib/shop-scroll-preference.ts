import * as SecureStore from "expo-secure-store";

const STORAGE_KEY = "shopyethu.shop-scroll-preference.v1";

export async function readShopScrollPreference() {
    const saved = await SecureStore.getItemAsync(STORAGE_KEY);
    if (saved === null || saved === "whole-screen") return false;
    if (saved === "fixed-header") return true;
    throw new Error("The saved Shop scrolling preference is invalid.");
}

export function saveShopScrollPreference(keepHeaderFixed: boolean) {
    return SecureStore.setItemAsync(
        STORAGE_KEY,
        keepHeaderFixed ? "fixed-header" : "whole-screen",
    );
}
