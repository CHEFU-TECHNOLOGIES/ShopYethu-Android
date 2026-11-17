import { useRef, useState } from "react";
import { api } from "@/lib/api";
import type { Product } from "@/types/marketplace";
import { router } from "expo-router";

export function useProductActions(
    product: Product,
    onClose: () => void,
    onOptimistic: (action: "draft" | "delete", product: Product) => void,
    onSettled: (productId: string) => void,
) {
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [busy, setBusy] = useState<"draft" | "delete" | null>(null);
    const [error, setError] = useState("");
    const locked = useRef(false);

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

    async function submit(action: "draft" | "delete") {
        if (locked.current || (action === "delete" && !confirmDelete)) return;
        locked.current = true;
        setBusy(action);
        setError("");
        onOptimistic(action, product);
        try {
            const path = `/seller/products/${encodeURIComponent(product.id)}`;
            await api(action === "draft" ? `${path}/draft` : path, {
                method: action === "draft" ? "PUT" : "DELETE",
                ...(action === "draft" ? { body: JSON.stringify({}) } : {}),
            });
            onClose();
        } catch (cause) {
            setError(
                cause instanceof Error
                    ? `${cause.message} Your product was restored.`
                    : "Could not update this product. Your product was restored.",
            );
        } finally {
            onSettled(product.id);
            locked.current = false;
            setBusy(null);
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
