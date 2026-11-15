import {
    Button,
    Field,
    Page,
    ResourceState,
    SignInNotice,
} from "@/components/market/Primitives";
import { InventoryRow } from "@/components/selling/InventoryRow";
import { StoreOverview } from "@/components/selling/StoreOverview";
import { palette, ui } from "@/constants/market-theme";
import { sellerStyles as styles } from "@/constants/seller-styles";
import { useSellerInventory } from "@/hooks/use-seller-inventory";
import { useAuth } from "@/lib/auth";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";
import { DebouncedPressable as Pressable } from "@/components/ui/DebouncedPressable";

export default function SellingScreen() {
    const { session } = useAuth();
    const resource = useSellerInventory();
    const [filter, setFilter] = useState("All");
    const [search, setSearch] = useState("");
    const products = resource.data?.products || [];
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
    return (
        <Page
            title="My Store"
            subtitle="A little business. A world of possibility."
            back
            onRefresh={session ? resource.refresh : undefined}
            refreshing={resource.refreshing}
        >
            {!session ? (
                <SignInNotice />
            ) : (
                <>
                    <ResourceState {...resource} retry={resource.refresh} />
                    {!!resource.error && (
                        <Button
                            title="View seller application"
                            secondary
                            onPress={() => router.navigate("/application")}
                        />
                    )}
                    {resource.data && (
                        <>
                            <StoreOverview data={resource.data} />
                            <View style={styles.actions}>
                                <View style={styles.action}>
                                    <Button
                                        title="Add product"
                                        onPress={() =>
                                            router.navigate("/selling/product")
                                        }
                                        trailingIcon={
                                            <Ionicons
                                                name="add"
                                                size={19}
                                                color="#FFFFFF"
                                            />
                                        }
                                    />
                                </View>
                                <View style={styles.action}>
                                    <Button
                                        title="Orders"
                                        secondary
                                        onPress={() =>
                                            router.navigate("/selling/orders")
                                        }
                                        trailingIcon={
                                            <Ionicons
                                                name="receipt-outline"
                                                size={18}
                                                color={palette.brand}
                                            />
                                        }
                                    />
                                </View>
                            </View>
                            {!products.length ? (
                                <View style={[ui.card, styles.empty]}>
                                    <View style={styles.emptyIcon}>
                                        <Ionicons
                                            name="storefront-outline"
                                            size={32}
                                            color={palette.brand}
                                        />
                                    </View>
                                    <Text style={ui.heading}>
                                        Make your first listing
                                    </Text>
                                    <Text style={[ui.subtitle, styles.center]}>
                                        Add a few photos, a price and stock.
                                        Save a draft or publish when you’re
                                        ready.
                                    </Text>
                                </View>
                            ) : (
                                <>
                                    <View style={styles.inventorySection}>
                                        <View style={styles.inventoryHeader}>
                                            <Text style={ui.heading}>
                                                Products
                                            </Text>
                                            <View style={styles.inventoryCount}>
                                                <Text
                                                    style={
                                                        styles.inventoryCountText
                                                    }
                                                >
                                                    {products.length}{" "}
                                                    {products.length === 1
                                                        ? "product"
                                                        : "products"}
                                                </Text>
                                            </View>
                                        </View>
                                        <View style={styles.inventoryControls}>
                                            <Field
                                                label="Search products"
                                                placeholder="Name or category"
                                                value={search}
                                                onChangeText={setSearch}
                                                autoCorrect={false}
                                            />
                                            <View
                                                accessibilityRole="tablist"
                                                style={styles.inventoryFilters}
                                            >
                                                {[
                                                    "All",
                                                    "Published",
                                                    "Drafts",
                                                ].map((value) => (
                                                <Pressable
                                                    key={value}
                                                    accessibilityRole="tab"
                                                    accessibilityLabel={`${value} products`}
                                                    accessibilityState={{
                                                        selected:
                                                            filter === value,
                                                    }}
                                                    hitSlop={2}
                                                    onPress={() =>
                                                        setFilter(value)
                                                    }
                                                    style={[
                                                        styles.inventoryFilter,
                                                        filter === value &&
                                                            styles.inventoryFilterActive,
                                                    ]}
                                                >
                                                    <Text
                                                        style={[
                                                            styles.inventoryFilterText,
                                                            filter === value &&
                                                                styles.inventoryFilterActiveText,
                                                        ]}
                                                    >
                                                        {value}
                                                    </Text>
                                                </Pressable>
                                                ))}
                                            </View>
                                        </View>
                                        {visible.length ? (
                                            <View
                                                style={styles.inventoryProducts}
                                            >
                                                {visible.map((product) => (
                                                    <InventoryRow
                                                        key={product.id}
                                                        product={product}
                                                    />
                                                ))}
                                            </View>
                                        ) : (
                                            <View
                                                style={styles.inventoryEmpty}
                                            >
                                                <Ionicons
                                                    name="search-outline"
                                                    size={24}
                                                    color={palette.muted}
                                                />
                                                <Text style={ui.body}>
                                                    No products found
                                                </Text>
                                                <Text
                                                    style={[
                                                        ui.small,
                                                        styles.center,
                                                    ]}
                                                >
                                                    Try another search or filter.
                                                </Text>
                                                <Pressable
                                                    accessibilityRole="button"
                                                    onPress={() => {
                                                        setFilter("All");
                                                        setSearch("");
                                                    }}
                                                    style={styles.clearFilters}
                                                >
                                                    <Text
                                                        style={
                                                            styles.clearFiltersText
                                                        }
                                                    >
                                                        Clear filters
                                                    </Text>
                                                </Pressable>
                                            </View>
                                        )}
                                        {products.length >= 100 && (
                                            <Text style={ui.small}>
                                                Showing the first 100 products.
                                            </Text>
                                        )}
                                    </View>
                                </>
                            )}
                        </>
                    )}
                    
                </>
            )}
        </Page>
    );
}
