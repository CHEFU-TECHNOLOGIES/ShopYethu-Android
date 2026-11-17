import { Share } from "react-native";
import { money } from "@/constants/market-theme";
import type { Product, Storefront } from "@/types/marketplace";

export function productShareUrl(productId: string) {
    return `https://api.chefu.co.za/shopyethu/product/${encodeURIComponent(productId)}`;
}

export function productShareMessage(
    product: Pick<Product, "id" | "name" | "priceCents">,
    store: Pick<Storefront, "name">,
) {
    return `Check out ${product.name} from ${store.name} on ShopYethu for ${money(product.priceCents)}.\nView this product here:\n${productShareUrl(product.id)}`;
}

export async function shareProduct(
    product: Pick<Product, "id" | "name" | "priceCents">,
    store: Pick<Storefront, "name">,
) {
    await Share.share({
        title: `Discover ${product.name} on ShopYethu`,
        message: productShareMessage(product, store),
    });
}
