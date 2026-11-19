import { CatalogSkeleton } from "@/components/market/CatalogSkeleton";
import { CatalogSortSelector } from "@/components/market/CatalogSortSelector";
import { ClearableTextInput } from "@/components/market/ClearableTextInput";
import { Button, ResourceState } from "@/components/market/Primitives";
import { ProductCard } from "@/components/market/ProductCard";
import { DebouncedPressable as Pressable } from "@/components/ui/DebouncedPressable";
import { home } from "@/constants/home-styles";
import { palette, ui } from "@/constants/market-theme";
import { useShopScreen } from "@/hooks/use-shop-screen";
import { useCart } from "@/lib/cart";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
    FlatList,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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
    const { items, add } = useCart();
    const basketCount = items.reduce((sum, item) => sum + item.quantity, 0);

    const shopHeader = (
        <View style={{ gap: 18, paddingBottom: 18 }}>
            <View style={home.brand}>
                <View style={styles.brandIdentity}>
                    {/**TODO Uncomment on major version */}
                    {/* <Image
                        source={require("@/assets/images/shopyethu-icon.png")}
                        style={home.icon}
                    /> */}
                    <Text accessibilityRole="header" style={home.name}>
                        ShopYethu
                    </Text>
                </View>
                <View style={styles.headerActions}>
                    {/**TODO Uncomment when notification settings are implemented */}
                    {/* <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Notification settings"
                        onPress={() => router.push("/notification-settings")}
                        style={styles.headerAction}
                    >   
                        <Ionicons
                            name="notifications-outline"
                            size={25}
                            color={palette.ink}
                        />
                        <View style={styles.notificationDot} />
                    </Pressable> */}
                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Open wishlist"
                        onPress={() => router.push("/favorites")}
                        style={styles.headerAction}
                    >
                        <Ionicons
                            name="heart-outline"
                            size={25}
                            color={palette.brand}
                            accessible={false}
                        />
                    </Pressable>
                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`Open basket, ${basketCount} items`}
                        onPress={() => router.push("/cart")}
                        style={styles.headerAction}
                    >
                        <Ionicons
                            name="cart-outline"
                            size={25}
                            color={palette.ink}
                        />
                        {basketCount > 0 ? (
                            <View style={styles.cartBadge}>
                                <Text style={styles.cartBadgeText}>
                                    {basketCount}
                                </Text>
                            </View>
                        ) : null}
                    </Pressable>
                </View>
            </View>
            <View style={home.search}>
                <Ionicons
                    name="search"
                    size={20}
                    color={palette.muted}
                    accessible={false}
                    style={styles.searchIcon}
                />
                <ClearableTextInput
                    accessibilityLabel="Search products"
                    clearLabel="search"
                    placeholder="Search products, stores or categories..."
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
            {!query ? (
                <View style={styles.hero}>
                    <Image
                        source={require("@/assets/images/ShopYethu Lifestyle Essentials.png")}
                        style={styles.heroImage}
                        resizeMode="cover"
                        accessible={false}
                    />
                    <View style={styles.heroOverlay} />
                    <View style={styles.heroCopy}>
                        <Text style={styles.heroTitle}>
                            <Text style={styles.heroTitleWhite}>
                                Shop Local{"\n"}
                            </Text>
                            <Text style={styles.heroTitleLime}>
                                Support Local
                            </Text>
                        </Text>
                        <Text style={styles.heroDescription}>
                            Discover great products from local sellers near you.
                        </Text>
                    </View>
                </View>
            ) : null}
            <View style={styles.productsHeading}>
                <Text accessibilityRole="header" style={home.sectionTitle}>
                    {query
                        ? "Search results"
                        : category === "All"
                          ? "Popular Products"
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
                                ? "No products found in the results loaded so far. Load more to continue browsing."
                                : query || category !== "All"
                                  ? "No products match your current search or category. Try adjusting your search or choosing another category."
                                  : "No products are available at the moment. Please check back soon."
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
            renderItem={({ item }) => (
                <ProductCard product={item} onAddToBasket={add} />
            )}
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
    brandIdentity: { flexDirection: "row", alignItems: "center", gap: 10 },
    headerActions: { flexDirection: "row", alignItems: "center", gap: 8 },
    headerAction: {
        width: 42,
        height: 42,
        alignItems: "center",
        justifyContent: "center",
    },
    notificationDot: {
        position: "absolute",
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: "#D84A3D",
        top: 4,
        right: 5,
        borderWidth: 2,
        borderColor: palette.canvas,
    },
    cartBadge: {
        position: "absolute",
        top: 1,
        right: 0,
        minWidth: 20,
        height: 20,
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: palette.brand,
        paddingHorizontal: 4,
    },
    cartBadgeText: { color: palette.paper, fontSize: 11, fontWeight: "800" },
    searchIcon: { position: "absolute", left: 14, zIndex: 1 },
    hero: {
        alignSelf: "center",
        width: "100%",
        height: 146,
        borderRadius: 24,
        backgroundColor: "#105B48",
        overflow: "hidden",
        justifyContent: "center",
    },
    heroImage: {
        ...StyleSheet.absoluteFill,
        width: "100%",
        height: "100%",
    },
    heroOverlay: {
        ...StyleSheet.absoluteFill,
        backgroundColor: "rgba(8, 58, 48, 0.28)",
    },
    heroCopy: {
        width: "62%",
        paddingHorizontal: 18,
        paddingVertical: 16,
        gap: 8,
        zIndex: 2,
    },
    heroTitle: { fontSize: 27, lineHeight: 31, fontWeight: "900" },
    heroTitleWhite: { color: palette.paper },
    heroTitleLime: { color: "#DDF39A" },
    heroDescription: {
        color: palette.paper,
        fontSize: 12,
        lineHeight: 17,
        maxWidth: 190,
    },
    heroButton: {
        alignSelf: "flex-start",
        minHeight: 44,
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        borderRadius: 22,
        backgroundColor: "#DDF39A",
        paddingHorizontal: 16,
    },
    heroButtonText: { color: palette.ink, fontSize: 15, fontWeight: "800" },
    categoryHeading: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    seeAll: { color: palette.brand, fontSize: 12, fontWeight: "800" },
    categoryTiles: { gap: 10, paddingRight: 20 },
    categoryTile: {
        width: 85,
        height: 70,
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        borderRadius: 18,
        backgroundColor: palette.paper,
        borderWidth: 1,
        borderColor: palette.line,
    },
    categoryTileText: {
        color: palette.ink,
        fontSize: 10,
        fontWeight: "700",
        textAlign: "center",
    },
    productsHeading: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
});
