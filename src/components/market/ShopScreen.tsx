import {
    FlatList,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { DebouncedPressable as Pressable } from "@/components/ui/DebouncedPressable";
import { SafeAreaView } from "react-native-safe-area-context";
import { ClearableTextInput } from "@/components/market/ClearableTextInput";
import { Button, ResourceState } from "@/components/market/Primitives";
import { CatalogSkeleton } from "@/components/market/CatalogSkeleton";
import { ProductCard } from "@/components/market/ProductCard";
import { CatalogSortSelector } from "@/components/market/CatalogSortSelector";
import { home } from "@/constants/home-styles";
import { palette, ui } from "@/constants/market-theme";
import { useShopScreen } from "@/hooks/use-shop-screen";

export default function ShopScreen() {
    const {
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
    } = useShopScreen();

    const shopHeader = (
        <View style={{ gap: 18, paddingBottom: 18 }}>
            <View style={home.brand}>
                <Image
                    source={require("@/assets/images/shopyethu-icon.png")}
                    style={home.icon}
                />
                <Text accessibilityRole="header" style={home.name}>
                    ShopYethu
                </Text>
            </View>
            <View style={home.search}>
                <ClearableTextInput
                    accessibilityLabel="Search products"
                    clearLabel="search"
                    placeholder="Search products..."
                    placeholderTextColor={palette.muted}
                    value={search}
                    onChangeText={setSearch}
                    style={home.searchInput}
                    containerStyle={{ flex: 1 }}
                    returnKeyType="search"
                    autoCorrect={false}
                />
            </View>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={home.categories}
            >
                {categories.map((item) => (
                    <Pressable
                        key={item}
                        accessibilityRole="tab"
                        accessibilityState={{
                            selected: category === item,
                        }}
                        onPress={() => setCategory(item)}
                        style={[
                            home.category,
                            category === item && home.selectedCategory,
                        ]}
                    >
                        <Text
                            style={[
                                home.categoryText,
                                category === item && home.selectedText,
                            ]}
                        >
                            {item}
                        </Text>
                    </Pressable>
                ))}
            </ScrollView>
            <View style={styles.productsHeading}>
                <Text accessibilityRole="header" style={home.sectionTitle}>
                    {query
                        ? "Search results"
                        : category === "All"
                          ? "Products"
                          : category}
                </Text>
                <CatalogSortSelector value={sort} onChange={setSort} />
            </View>
            {!resource.data && resource.loading ? (
                <CatalogSkeleton />
            ) : (
                <ResourceState
                    {...resource}
                    retry={resource.refresh}
                    empty={
                        resource.data && products.length === 0
                            ? resource.data.nextCursor
                                ? "No products from sellers yet. Load more to keep searching."
                                : "No products from sellers found. Try another search or category."
                            : undefined
                    }
                />
            )}
        </View>
    );

    const productList = (
        <FlatList
            style={keepHeaderFixed ? styles.fixedProducts : undefined}
            data={products}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <ProductCard product={item} />}
            numColumns={2}
            columnWrapperStyle={{ justifyContent: "space-between" }}
            contentContainerStyle={
                keepHeaderFixed
                    ? styles.fixedProductsContent
                    : [ui.content, { gap: 0 }]
            }
            initialNumToRender={8}
            maxToRenderPerBatch={8}
            windowSize={7}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            onRefresh={resource.refresh}
            refreshing={resource.refreshing}
            ListHeaderComponent={keepHeaderFixed ? undefined : shopHeader}
            ListFooterComponent={
                resource.data?.nextCursor ? (
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
        />
    );

    return (
        <SafeAreaView style={ui.page} edges={["top"]}>
            {keepHeaderFixed ? (
                <View style={styles.fixedScreen}>
                    <View style={styles.fixedHeader}>{shopHeader}</View>
                    {productList}
                </View>
            ) : (
                productList
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    fixedScreen: { flex: 1 },
    fixedHeader: { paddingHorizontal: 20, paddingTop: 20 },
    fixedProducts: { flex: 1 },
    fixedProductsContent: { paddingHorizontal: 20, paddingBottom: 36 },
    productsHeading: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
});
