import { useCallback, useEffect, useState } from "react";
import { useFocusEffect } from "expo-router";
import { useProductFeed } from "@/hooks/use-product-feed";
import { categories } from "@/lib/config";
import { useAuth } from "@/lib/auth";
import { useShopScrollPreference } from "@/hooks/use-shop-scroll-preference";
import type { CatalogSort } from "@/types/marketplace";

export function useShopScreen() {
    const { session } = useAuth();
    const [search, setSearch] = useState("");
    const [query, setQuery] = useState("");
    const [category, setCategory] = useState("All");
    const [sort, setSort] = useState<CatalogSort>("newest");
    const {
        keepHeaderFixed,
        reload: reloadScrollPreference,
    } = useShopScrollPreference();

    useFocusEffect(
        useCallback(() => reloadScrollPreference(), [reloadScrollPreference]),
    );

    useEffect(() => {
        const timer = setTimeout(() => setQuery(search), 350);
        return () => clearTimeout(timer);
    }, [search]);

    const resource = useProductFeed(
        `/products?page=1&view=compact&q=${encodeURIComponent(query)}&category=${encodeURIComponent(category === "All" ? "" : category)}&sort=${sort}&includeStoreVerification=1`,
    );
    const products =
        resource.data?.products.filter(
            (product) => product.ownerUid !== session?.user.uid,
        ) ?? [];

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
        products,
        keepHeaderFixed,
    };
}
