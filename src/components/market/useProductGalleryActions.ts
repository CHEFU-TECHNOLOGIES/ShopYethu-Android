import * as Clipboard from "expo-clipboard";
import { toast } from "@/lib/toast";
import { productShareUrl, shareProduct } from "@/lib/product-sharing";
import type { Product, Storefront } from "@/types/marketplace";
import { router } from "expo-router";
import { useRef } from "react";

export function useProductGalleryActions(
    product: Product,
    store: Storefront,
    onClose: () => void,
) {
    const sharing = useRef(false);
    const copying = useRef(false);

    function share() {
        onClose();
        if (sharing.current) return;
        sharing.current = true;
        void shareProduct(product, store)
            .catch((cause: unknown) => {
                toast.error(
                    cause instanceof Error
                        ? cause.message
                        : "Could not share this product. Please try again.",
                );
            })
            .finally(() => {
                sharing.current = false;
            });
    }

    function report() {
        onClose();
        router.navigate({
            pathname: "/report",
            params: { productId: product.id },
        });
    }

    async function copyLink() {
        onClose();
        if (copying.current) return;
        copying.current = true;
        try {
            await Clipboard.setStringAsync(productShareUrl(product.id));
            toast.success("Product link copied.");
        } catch (cause) {
            toast.error(
                cause instanceof Error
                    ? cause.message
                    : "Could not copy this product link. Please try again.",
            );
        } finally {
            copying.current = false;
        }
    }

    return { share, report, copyLink };
}
