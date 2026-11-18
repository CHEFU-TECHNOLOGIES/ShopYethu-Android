import {
    Button,
    Field,
    ResourceState,
    SignInNotice,
} from "@/components/market/Primitives";
import { ListPage } from "@/components/market/ListPage";
import { InventoryRow } from "@/components/selling/InventoryRow";
import { StoreOverview } from "@/components/selling/StoreOverview";
import { StoreSkeleton } from "@/components/selling/StoreSkeleton";
import { ProductActions } from "@/components/selling/ProductActions";
import { CatalogSortSelector } from "@/components/market/CatalogSortSelector";
import type { Product } from "@/types/marketplace";
import { palette, ui } from "@/constants/market-theme";
import { sellerStyles as styles } from "@/constants/seller-styles";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Text, View } from "react-native";
import { DebouncedPressable as Pressable } from "@/components/ui/DebouncedPressable";
import { useSellingInventoryScreen } from "@/hooks/use-selling-inventory-screen";

export default function SellingScreen() {
    const {
        session,
        resource,
        filter,
        setFilter,
        search,
        setSearch,
        sort,
        setSort,
        selectedProduct,
        setSelectedProduct,
        products,
        inventory,
        visible,
        onOptimistic,
        onSettled,
        clearFilters,
    } = useSellingInventoryScreen();
    return (
        <ListPage<Product>
            title="My Store"
            data={session && resource.data ? visible : []}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
                <InventoryRow product={item} onActions={setSelectedProduct} />
            )}
            ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
            onRefresh={session ? resource.refresh : undefined}
            refreshing={resource.refreshing}
            ListEmptyComponent={
                !session || !resource.data ? undefined : !products.length ? (
                    <View style={[ui.card, styles.empty]}>
                        <View style={styles.emptyIcon}>
                            <Ionicons
                                name="storefront-outline"
                                size={32}
                                color={palette.brand}
                            />
                        </View>
                        <Text style={ui.heading}>Make your first listing</Text>
                        <Text style={[ui.subtitle, styles.center]}>
                            Add a few photos, a price and stock. Save a draft or
                            publish when you’re ready.
                        </Text>
                    </View>
                ) : (
                    <View style={styles.inventoryEmpty}>
                        <Ionicons
                            name="search-outline"
                            size={24}
                            color={palette.muted}
                        />
                        <Text style={ui.body}>
                            {resource.data.nextCursor
                                ? "No matches in loaded products"
                                : "No products found"}
                        </Text>
                        <Text style={[ui.small, styles.center]}>
                            Try another search or filter.
                        </Text>
                        <Pressable
                            accessibilityRole="button"
                            onPress={() => {
                                clearFilters();
                            }}
                            style={styles.clearFilters}
                        >
                            <Text style={styles.clearFiltersText}>
                                Clear filters
                            </Text>
                        </Pressable>
                    </View>
                )
            }
            ListFooterComponent={
                session && resource.data?.nextCursor ? (
                    <Button
                        title={
                            resource.loadingMore
                                ? "Loading more…"
                                : "Load more products"
                        }
                        secondary
                        disabled={resource.loadingMore}
                        onPress={() => void resource.more()}
                    />
                ) : undefined
            }
            header={
                !session ? (
                    <SignInNotice />
                ) : (
                    <>
                        <ResourceState
                            {...resource}
                            retry={resource.refresh}
                            loadingFallback={<StoreSkeleton />}
                        />
                        {!!resource.error && (
                            <Button
                                title="View seller application"
                                secondary
                                onPress={() => router.navigate("/application")}
                            />
                        )}
                        {inventory && (
                            <>
                                <StoreOverview data={inventory} />
                                <View style={styles.actions}>
                                    <View style={styles.action}>
                                        <Button
                                            title="Add product"
                                            onPress={() =>
                                                router.navigate(
                                                    "/selling/product",
                                                )
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
                                                router.navigate(
                                                    "/selling/orders",
                                                )
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
                                <View style={styles.inventorySection}>
                                    <View style={styles.inventoryHeader}>
                                        <Text style={ui.heading}>Products</Text>
                                        <CatalogSortSelector
                                            value={sort}
                                            onChange={setSort}
                                        />
                                    </View>
                                    <View style={styles.inventoryControls}>
                                        <Field
                                            label="Search products"
                                            placeholder="Name or category"
                                            value={search}
                                            onChangeText={setSearch}
                                            autoCorrect={false}
                                        />
                                        <Text style={ui.small}>
                                            {inventory.nextCursor
                                                ? "Search, filters, and sorting apply to loaded products. Load more to include more."
                                                : "Search, filters, and sorting apply to all your products."}
                                        </Text>
                                        <View
                                            accessibilityRole="tablist"
                                            style={styles.inventoryFilters}
                                        >
                                            {["All", "Published", "Drafts"].map(
                                                (value) => (
                                                    <Pressable
                                                        key={value}
                                                        accessibilityRole="tab"
                                                        accessibilityLabel={`${value} products`}
                                                        accessibilityState={{
                                                            selected:
                                                                filter ===
                                                                value,
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
                                                                filter ===
                                                                    value &&
                                                                    styles.inventoryFilterActiveText,
                                                            ]}
                                                        >
                                                            {value}
                                                        </Text>
                                                    </Pressable>
                                                ),
                                            )}
                                        </View>
                                    </View>
                                </View>
                            </>
                        )}
                    </>
                )
            }
        >
            {session && selectedProduct?.ownerUid === session.user.uid && (
                <ProductActions
                    key={`${session.user.uid}:${selectedProduct.id}`}
                    product={selectedProduct}
                    onClose={() => setSelectedProduct(null)}
                    onOptimistic={onOptimistic}
                    onSettled={onSettled}
                />
            )}
        </ListPage>
    );
}
