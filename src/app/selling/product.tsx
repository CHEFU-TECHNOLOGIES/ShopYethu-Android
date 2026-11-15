import { Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import {
    Button,
    Page,
    ResourceState,
    SignInNotice,
} from "@/components/market/Primitives";
import { ProductEditor } from "@/components/selling/ProductEditor";
import { useResource } from "@/hooks/use-resource";
import { useSellerAccount } from "@/hooks/use-seller-account";
import { useAuth } from "@/lib/auth";
import type { Product, Storefront } from "@/types/marketplace";
import { ui } from "@/constants/market-theme";

export default function ProductScreen() {
    const { id } = useLocalSearchParams<{ id?: string }>();
    const { session } = useAuth();
    const account = useSellerAccount(!id, 60_000);
    const product = useResource<{ product: Product; store: Storefront }>(
        `/seller/products/${encodeURIComponent(id || "")}`,
        !!session && !!id,
        60_000,
    );
    const resource = id ? product : account;
    const allowed =
        (id ? product.data?.store : account.data?.store)?.status === "active";
    if (session && allowed) {
        return (
            <ProductEditor
                key={`${session.user.uid}:${id || "new"}`}
                uid={session.user.uid}
                product={id ? product.data?.product : undefined}
                reload={resource.refresh}
            />
        );
    }
    return (
        <Page title={id ? "Edit product" : "Add product"} back>
            {!session ? (
                <SignInNotice />
            ) : (
                <>
                    <ResourceState {...resource} retry={resource.refresh} />
                    {!id && account.data && !allowed && (
                        <View style={ui.card}>
                            <Text style={ui.heading}>
                                {account.data.store?.status === "suspended"
                                    ? "Selling is suspended"
                                    : "Seller approval required"}
                            </Text>
                            <Text style={ui.subtitle}>
                                {account.data.store?.reason ||
                                    "Your application must be approved before adding products."}
                            </Text>
                            <Button
                                title="View application"
                                onPress={() => router.navigate("/application")}
                            />
                        </View>
                    )}
                </>
            )}
        </Page>
    );
}
