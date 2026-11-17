import { useEffect, useState } from "react";
import { useProductFeed } from "@/hooks/use-product-feed";
import { categories } from "@/lib/config";
import type { CatalogSort } from "@/types/marketplace";

export function useShopScreen() {
    const [search, setSearch] = useState("");
    const [query, setQuery] = useState("");
    const [category, setCategory] = useState("All");
    const [sort, setSort] = useState<CatalogSort>("newest");

    useEffect(() => {
        const timer = setTimeout(() => setQuery(search), 350);
        return () => clearTimeout(timer);
    }, [search]);

    const resource = useProductFeed(
        `/products?page=1&view=compact&q=${encodeURIComponent(query)}&category=${encodeURIComponent(category === "All" ? "" : category)}&sort=${sort}&includeStoreVerification=1`,
    );

    return {
        search,
        setSearch,
        query,
        category,
        setCategory,
        categories,
        sort,
        setSort,
        resource,
    };
}
