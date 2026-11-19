import { useRef, useState } from "react";
import { randomUUID } from "expo-crypto";
import { api } from "@/lib/api";
import {
    getProductPublishIssue,
    publishProductDraft,
} from "@/lib/publish-product";
import type { Product } from "@/types/marketplace";
import { router } from "expo-router";
import { toast } from "@/lib/toast";

type ProductAction = "draft" | "publish" | "delete";

export function useProductActions(
    product: Product,
    onClose: () => void,
    onOptimistic: (action: ProductAction, product: Product) => void,
    onSettled: (productId: string) => void,
) {
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [busy, setBusy] = useState<ProductAction | null>(null);
    const [error, setError] = useState("");
    const locked = useRef(false);
    const publishKey = useRef<string | null>(null);

    function close() {
        if (!locked.current) onClose();
    }

    function editProduct() {
        if (locked.current) return;
        onClose();
        router.navigate({
            pathname: "/selling/product",
            params: { id: product.id },
        });
    }

    function requestDeleteConfirmation() {
        if (!locked.current) setConfirmDelete(true);
    }

    async function submit(action: ProductAction) {
        if (locked.current || (action === "delete" && !confirmDelete)) return;
        if (action === "publish" && product.published) return;
        if (action === "publish") {
            const issue = getProductPublishIssue(product);
            if (issue) {
                setError(issue);
                return;
            }
        }
        locked.current = true;
        setBusy(action);
        setError("");
        onOptimistic(action, product);
        onClose();
        try {
            const path = `/seller/products/${encodeURIComponent(product.id)}`;
            if (action === "publish") {
                publishKey.current ||= randomUUID();
                await publishProductDraft(product, publishKey.current);
                publishKey.current = null;
            } else {
                await api(action === "draft" ? `${path}/draft` : path, {
                    method: action === "draft" ? "PUT" : "DELETE",
                    ...(action === "draft" ? { body: JSON.stringify({}) } : {}),
                });
            }
        } catch (cause) {
            toast.error(
                cause instanceof Error
                    ? `${cause.message} Your product was restored.`
                    : "Could not update this product. Your product was restored.",
            );
        } finally {
            onSettled(product.id);
            locked.current = false;
        }
    }

    return {
        confirmDelete,
        setConfirmDelete,
        busy,
        error,
        close,
        editProduct,
        requestDeleteConfirmation,
        submit,
    };
}
