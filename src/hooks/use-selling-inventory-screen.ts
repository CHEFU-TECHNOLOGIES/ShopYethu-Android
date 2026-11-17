import { useState } from "react";
import { useSellerInventory } from "@/hooks/use-seller-inventory";
import { useAuth } from "@/lib/auth";
import type { Product } from "@/types/marketplace";

export function useSellingInventoryScreen() {
    const { session } = useAuth();
    const resource = useSellerInventory();
    const [filter, setFilter] = useState("All");
    const [search, setSearch] = useState("");
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [optimisticProducts, setOptimisticProducts] = useState<
        Record<string, Product | null>
    >({});
    const products = (resource.data?.products || []).flatMap((product) => {
        if (!Object.prototype.hasOwnProperty.call(optimisticProducts, product.id)) {
            return [product];
        }
        const optimistic = optimisticProducts[product.id];
        return optimistic ? [optimistic] : [];
    });
    const inventory = resource.data ? { ...resource.data, products } : null;
    const visible = products.filter(
        (product) =>
            (filter === "All" ||
                (filter === "Published"
                    ? product.published
                    : !product.published)) &&
            `${product.name} ${product.category}`
                .toLowerCase()
                .includes(search.trim().toLowerCase()),
    );

    function onOptimistic(
        action: "draft" | "delete",
        product: Product,
    ) {
        setOptimisticProducts((current) => ({
            ...current,
            [product.id]:
                action === "delete" ? null : { ...product, published: false },
        }));
    }

    function onSettled(productId: string) {
        setOptimisticProducts((current) => {
            const next = { ...current };
            delete next[productId];
            return next;
        });
    }

    function clearFilters() {
        setFilter("All");
        setSearch("");
    }

    return {
        session,
        resource,
        filter,
        setFilter,
        search,
        setSearch,
        selectedProduct,
        setSelectedProduct,
        products,
        inventory,
        visible,
        onOptimistic,
        onSettled,
        clearFilters,
    };
}
