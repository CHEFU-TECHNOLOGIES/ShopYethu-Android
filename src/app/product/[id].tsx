import {
    FlatList,
    Text,
    View,
} from "react-native";
import { DebouncedPressable as Pressable } from "@/components/ui/DebouncedPressable";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { ProductGalleryPhoto } from "@/components/market/ProductGalleryPhoto";
import { ProductGalleryActionsMenu } from "@/components/market/ProductGalleryActionsMenu";
import { ExpandableDescription } from "@/components/market/ExpandableDescription";
import { Page, ResourceState } from "@/components/market/Primitives";
import { productDetailStyles as styles } from "@/constants/product-detail-styles";
import { money, palette, ui } from "@/constants/market-theme";
import { OperatingAreaLabel } from "@/components/market/OperatingAreaLabel";
import { ProductDetailsSkeleton } from "@/components/market/ProductDetailsSkeleton";
import { ProductReviews } from "@/components/market/ProductReviews";
import { useProductDetailScreen } from "@/hooks/use-product-detail-screen";

export default function ProductScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const {
        resource,
        product,
        store,
        ownProduct,
        productQuantity,
        basketCount,
        galleryWidth,
        galleryHeight,
        stockText,
        activePhoto,
        setActivePhoto,
        updateQuantity,
        addToBasket,
    } = useProductDetailScreen(id);

    return (
        <Page
            title={product?.name || "Product details"}
            back
            onRefresh={resource.refresh}
            refreshing={resource.refreshing}
            backAccessory={
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`View basket${basketCount ? `, ${basketCount} items` : ""}`}
                    onPress={() => router.navigate("/cart")}
                    style={styles.basketButton}
                >
                    <Ionicons
                        name="basket-outline"
                        size={20}
                        color={palette.brand}
                    />
                    {basketCount > 0 && (
                        <View style={styles.basketCount}>
                            <Text style={styles.basketCountText}>
                                {basketCount > 99 ? "99+" : basketCount}
                            </Text>
                        </View>
                    )}
                </Pressable>
            }
            
        >
            <ResourceState
                {...resource}
                retry={resource.refresh}
                loadingFallback={<ProductDetailsSkeleton />}
            />
            {product && store && (
                <>
                    {product.photos.length ? (
                        <View
                            style={[
                                styles.gallery,
                                styles.contentBlock,
                                {
                                    width: galleryWidth,
                                    height: galleryHeight,
                                },
                            ]}
                        >
                            <FlatList
                                horizontal
                                pagingEnabled
                                showsHorizontalScrollIndicator={false}
                                data={product.photos}
                                keyExtractor={(photo, index) => `${index}:${photo}`}
                                initialNumToRender={1}
                                maxToRenderPerBatch={2}
                                windowSize={3}
                                getItemLayout={(_, index) => ({
                                    length: galleryWidth,
                                    offset: galleryWidth * index,
                                    index,
                                })}
                                renderItem={({ item: photo }) => (
                                    <ProductGalleryPhoto
                                        uri={photo}
                                        label={`${product.name} photo`}
                                        width={galleryWidth}
                                        height={galleryHeight}
                                    />
                                )}
                                onMomentumScrollEnd={({ nativeEvent }) =>
                                    setActivePhoto(
                                        Math.round(
                                            nativeEvent.contentOffset.x /
                                                galleryWidth,
                                        ),
                                    )
                                }
                            />
                            {product.photos.length > 1 && (
                                <View style={styles.galleryCounter}>
                                    <Text style={styles.galleryCounterText}>
                                        {activePhoto + 1} /{" "}
                                        {product.photos.length}
                                    </Text>
                                </View>
                            )}
                            <ProductGalleryActionsMenu
                                product={product}
                                store={store}
                                showReport={!ownProduct}
                            />
                        </View>
                    ) : (
                        <View
                            style={[
                                styles.galleryPlaceholder,
                                styles.contentBlock,
                                {
                                    width: galleryWidth,
                                    height: galleryHeight,
                                },
                            ]}
                        >
                            <Ionicons
                                name="image-outline"
                                size={38}
                                color={palette.muted}
                            />
                            <ProductGalleryActionsMenu
                                product={product}
                                store={store}
                                showReport={!ownProduct}
                            />
                        </View>
                    )}

                    <View
                        style={[
                            styles.productDetails,
                            styles.contentBlock,
                        ]}
                    >
                        <View style={styles.productMeta}>
                            <View style={styles.categoryChip}>
                                <Text style={styles.categoryChipText}>
                                    {product.category}
                                </Text>
                            </View>
                            <View
                                style={[
                                    styles.stockChip,
                                    product.stock === 0 && styles.soldOutChip,
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.stockChipText,
                                        product.stock === 0 &&
                                            styles.soldOutText,
                                    ]}
                                >
                                    {stockText}
                                </Text>
                            </View>
                        </View>
                        <Text accessibilityRole="header" style={styles.name}>
                            {product.name}
                        </Text>
                        <Text style={styles.price}>
                            {money(product.priceCents)}
                        </Text>
                    </View>

                    <View style={[styles.section, styles.contentBlock]}>
                        <Text style={styles.sectionTitle}>About this item</Text>
                        <ExpandableDescription
                            key={product.description}
                            description={product.description}
                        />
                    </View>

                    <ProductReviews productId={product.id} />

                    <View style={[styles.section, styles.contentBlock]}>
                        <Text style={styles.sectionTitle}>How you can get it</Text>
                        <View style={styles.fulfilmentOptions}>
                            {product.fulfilment.map((option) => (
                                <View key={option} style={styles.fulfilmentChip}>
                                    <Ionicons
                                        name={
                                            option === "collection"
                                                ? "storefront-outline"
                                                : "car-outline"
                                        }
                                        size={16}
                                        color={palette.brand}
                                    />
                                    <Text style={styles.fulfilmentText}>
                                        {option === "collection"
                                            ? "Collection"
                                            : "Local delivery"}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    </View>

                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`Visit ${store.name} storefront`}
                        onPress={() =>
                            router.navigate({
                                pathname: "/store/[id]",
                                params: { id: store.id },
                            })
                        }
                        style={[styles.storeCard, styles.contentBlock]}
                    >
                        <View style={styles.storeInfo}>
                            <Text style={ui.small}>Sold by</Text>
                            <View style={styles.storeNameRow}>
                                <Text
                                    style={styles.storeName}
                                    numberOfLines={1}
                                    ellipsizeMode="tail"
                                >
                                    {store.name}
                                </Text>
                                {store.verified === true && (
                                    <MaterialIcons
                                        name="verified"
                                        size={16}
                                        color={palette.brand}
                                        accessible
                                        accessibilityRole="image"
                                        accessibilityLabel="Verified seller"
                                    />
                                )}
                            </View>
                            <OperatingAreaLabel
                                area={store.area}
                                placeId={store.areaPlaceId}
                                style={ui.small}
                            />
                        </View>
                        <View style={styles.storeVisit}>
                            <Text style={styles.storeVisitText}>Visit</Text>
                            <Ionicons
                                name="chevron-forward"
                                size={16}
                                color={palette.brand}
                            />
                        </View>
                    </Pressable>

                    {!ownProduct && (
                        <View
                            style={[
                                styles.purchaseCard,
                                styles.contentBlock,
                            ]}
                        >
                            <View style={styles.purchaseInfo}>
                                <Text style={ui.small}>Price</Text>
                                <Text style={styles.purchasePrice}>
                                    {money(product.priceCents)}
                                </Text>
                                <Text style={styles.stockNote}>
                                    {stockText}
                                </Text>
                            </View>
                            {product.stock === 0 ? (
                                <View
                                    accessibilityLabel="Sold out"
                                    style={styles.soldOutControl}
                                >
                                    <Text style={styles.soldOutControlText}>
                                        Sold out
                                    </Text>
                                </View>
                            ) : (
                                <View style={styles.quantityControl}>
                                    <Pressable
                                        accessibilityRole="button"
                                        accessibilityLabel={`Remove one ${product.name} from basket`}
                                        accessibilityState={{
                                            disabled: productQuantity === 0,
                                        }}
                                        testID="remove-from-cart"
                                        disabled={productQuantity === 0}
                                        onPress={() =>
                                            updateQuantity(
                                                product.id,
                                                productQuantity - 1,
                                            )
                                        }
                                        style={({ pressed }) => [
                                            styles.quantityStep,
                                            productQuantity === 0 &&
                                                styles.quantityStepDisabled,
                                            pressed &&
                                                productQuantity > 0 &&
                                                styles.quantityStepPressed,
                                        ]}
                                    >
                                        <Ionicons
                                            name="remove"
                                            size={20}
                                            color={
                                                productQuantity === 0
                                                    ? palette.muted
                                                    : "#FFFFFF"
                                            }
                                            accessible={false}
                                        />
                                    </Pressable>
                                    <Text
                                        accessibilityLabel={`${productQuantity} ${
                                            productQuantity === 1
                                                ? "item"
                                                : "items"
                                        } in basket`}
                                        accessibilityLiveRegion="polite"
                                        style={styles.quantityCount}
                                    >
                                        {productQuantity}
                                    </Text>
                                    <Pressable
                                        accessibilityRole="button"
                                        accessibilityLabel={`Add one ${product.name} to basket`}
                                        accessibilityState={{
                                            disabled:
                                                productQuantity >=
                                                Math.min(product.stock, 99),
                                        }}
                                        testID="add-to-cart"
                                        disabled={
                                            productQuantity >=
                                            Math.min(product.stock, 99)
                                        }
                                        onPress={addToBasket}
                                        style={({ pressed }) => [
                                            styles.quantityStep,
                                            productQuantity >=
                                                Math.min(product.stock, 99) &&
                                                styles.quantityStepDisabled,
                                            pressed &&
                                                productQuantity <
                                                    Math.min(
                                                        product.stock,
                                                        99,
                                                    ) &&
                                                styles.quantityStepPressed,
                                        ]}
                                    >
                                        <Ionicons
                                            name="add"
                                            size={20}
                                            color={
                                                productQuantity >=
                                                Math.min(product.stock, 99)
                                                    ? palette.muted
                                                    : "#FFFFFF"
                                            }
                                            accessible={false}
                                        />
                                    </Pressable>
                                </View>
                            )}
                        </View>
                    )}
                </>
            )}
        </Page>
    );
}
