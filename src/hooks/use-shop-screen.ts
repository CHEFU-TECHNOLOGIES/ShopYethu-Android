import { useEffect, useState } from "react";
import { useProductFeed } from "@/hooks/use-product-feed";
import { categories } from "@/lib/config";

export function useShopScreen() {
    const [search, setSearch] = useState("");
    const [query, setQuery] = useState("");
    const [category, setCategory] = useState("All");

    useEffect(() => {
        const timer = setTimeout(() => setQuery(search), 350);
        return () => clearTimeout(timer);
    }, [search]);

    const resource = useProductFeed(
        `/products?page=1&view=compact&q=${encodeURIComponent(query)}&category=${encodeURIComponent(category === "All" ? "" : category)}`,
    );

    return { search, setSearch, query, category, setCategory, categories, resource };
}
