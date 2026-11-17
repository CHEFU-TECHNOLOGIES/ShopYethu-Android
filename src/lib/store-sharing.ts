import { Share } from "react-native";
import type { Storefront } from "@/types/marketplace";

export function storeShareMessage(store: Pick<Storefront, "id" | "name">) {
    const url = `https://api.chefu.co.za/shopyethu/store/${encodeURIComponent(store.id)}`;
    return `Hola! Check out my store ${store.name} on ShopYethu 🛍️\nFind something lekker and support a kasi business:\n${url}\n\nHave a look around and find your next favourite.`;
}

export async function shareStore(store: Pick<Storefront, "id" | "name">) {
    const message = storeShareMessage(store);
    await Share.share({
        title: `Discover ${store.name} on ShopYethu`,
        message,
    });
}
