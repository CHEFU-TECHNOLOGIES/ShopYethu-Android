import { Text, View } from "react-native";
import { DebouncedPressable as Pressable } from "@/components/ui/DebouncedPressable";
import { router } from "expo-router";
import { OperatingAreaLabel } from "@/components/market/OperatingAreaLabel";
import { ResourceState } from "@/components/market/Primitives";
import { palette, ui } from "@/constants/market-theme";
import { useResource } from "@/hooks/use-resource";
import type { Storefront } from "@/types/marketplace";

export function OrderSellerLink({ storeId }: { storeId: string }) {
    const resource = useResource<{ store: Storefront }>(
        `/stores/${encodeURIComponent(storeId)}`,
    );
    const store = resource.data?.store;

    if (!store) {
        return <ResourceState {...resource} retry={resource.refresh} />;
    }

    return (
        <View style={[ui.card, { gap: 5 }]}>
            <Text style={ui.small}>Sold by</Text>
            <Pressable
                accessibilityRole="link"
                accessibilityLabel={`Visit ${store.name} storefront`}
                onPress={() =>
                    router.navigate({
                        pathname: "/store/[id]",
                        params: { id: store.id },
                    })
                }
                style={({ pressed }) => ({
                    alignSelf: "flex-start",
                    opacity: pressed ? 0.65 : 1,
                })}
            >
                <Text
                    style={{
                        color: palette.brand,
                        fontSize: 16,
                        fontWeight: "700",
                        textDecorationLine: "underline",
                    }}
                >
                    {store.name}
                </Text>
            </Pressable>
            <OperatingAreaLabel
                area={store.area}
                placeId={store.areaPlaceId}
                style={ui.small}
            />
        </View>
    );
}
