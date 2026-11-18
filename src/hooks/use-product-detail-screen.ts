import { useState } from "react";
import { useWindowDimensions } from "react-native";
import { useResource } from "@/hooks/use-resource";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { toast } from "@/lib/toast";
import type { Product, Storefront } from "@/types/marketplace";

export function useProductDetailScreen(id: string) {
    const { session } = useAuth();
    const resource = useResource<{ product: Product; store: Storefront }>(
        `/products/${id}`,
    );
    const { add, items, quantity: updateQuantity } = useCart();
    const { width: windowWidth } = useWindowDimensions();
    const [activePhoto, setActivePhoto] = useState(0);
    const product = resource.data?.product;
    const store = resource.data?.store;
    const productQuantity =
        items.find((item) => item.product.id === product?.id)?.quantity ?? 0;
    const ownProduct =
        !!session && product?.ownerUid === session.user.uid;
    const basketCount = items.reduce((total, item) => total + item.quantity, 0);
    const galleryWidth = Math.max(1, Math.min(windowWidth - 40, 560));
    const galleryHeight = galleryWidth * 1.04;
    const stockText = !product?.stock
        ? "Sold out"
        : product.stock <= 5
          ? `Only ${product.stock} left`
          : "In stock";

    function addToBasket() {
        if (!product) return;
        if (ownProduct) {
            toast.error("You cannot add your own product to your basket.");
            return;
        }
        try {
            add(product);
        } catch (error) {
            toast.error(
                error instanceof Error
                    ? error.message
                    : "Could not add this product to your basket.",
            );
        }
    }

    return {
        resource,
        product,
        store,
        ownProduct,
        productQuantity,
        basketCount,
        galleryWidth,
        galleryHeight,
        stockText,
        activePhoto,
        setActivePhoto,
        updateQuantity,
        addToBasket,
    };
}
